import base64 from 'base-64';
import { styled } from 'uebersicht';
import _config from './config.json';

const defaults = {
  startAt: 0,
  maxResults: 20,
};

const config = Object.assign({}, defaults, _config);

export const refreshFrequency = 1.8e6; // 30m

export const className = `
  left: 0rem;
  top: 0rem;
  color: white;
  font-family: -apple-system;
  z-index: 1;
  width: 900px;     /* 너비 설정 */
  height: 1200px;    /* 높이 설정 */  
`;

const IssueList = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0;
  padding: 0.25rem;
  border: 0.1rem solid #999;
  border-radius: 0.25rem;
  background-color: rgba(85, 85, 85, 1.0);
  list-style-type: none;
`;

const Item = styled.li`
  margin: 0.25rem 0;
`;

const ItemLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
`;

const Type = styled.img`
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
`;

const Status = styled.div`
  flex: 1;
  white-space: nowrap;
  flex-shrink: 1;
  flex-grow: 0;
  flex-basis: content;
  font-variant: small-caps;
  font-size: 0.9rem;
  text-align: center;
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
  border: 0.1rem solid #666;
  border-radius: 0.25rem;
  margin-right: 0.5rem;

  ${props => {
    const statusName = props.statusName?.toLowerCase() || '';
    if (statusName.includes('완료') || statusName.includes('done') || statusName.includes('closed')) {
      return `
        color: rgba(144, 238, 144, 1.0);
        border-color: rgba(144, 238, 144, 0.5);
        background-color: rgba(144, 238, 144, 0.1);
      `;
    }
    if (statusName.includes('진행') || statusName.includes('progress') || statusName.includes('in progress')) {
      return `
        color: rgba(135, 206, 250, 1.0);
        border-color: rgba(135, 206, 250, 0.5);
        background-color: rgba(135, 206, 250, 0.1);
      `;
    }
    if (statusName.includes('검토') || statusName.includes('review') || statusName.includes('reviewing')) {
      return `
        color: rgba(255, 215, 0, 1.0);
        border-color: rgba(255, 215, 0, 0.5);
        background-color: rgba(255, 215, 0, 0.1);
      `;
    }
    return `
      color: rgba(200, 200, 200, 1.0);
      border-color: #666;
    `;
  }}
`;

const Key = styled.span`
  flex: 1;
  white-space: nowrap;
  flex-shrink: 1;
  flex-grow: 0;
  flex-basis: content;
  font-variant: small-caps;
  font-size: 0.9rem;
  color: rgba(200, 200, 200, 1.0);
  text-align: center;
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
`;

const Summary = styled.span`
  flex: 1;
  white-space: nowrap;
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
  flex-grow: 1.5;  // 기존 2에서 1.5로 조정
  color: white;
  overflow: hidden;
  text-overflow: ellipsis;  // 긴 텍스트 처리
`;

const url = new URL(`http://127.0.0.1:41417/https://${config.jira_domain}/rest/api/3/search/jql`);
const params = {
  jql: `filter = ${config.jira_filter}`,
  startAt: config.startAt,
  maxResults: config.maxResults,
  fields: [
    'summary',
    'status',
    'issuetype',
    'assignee',
    'duedate',
  ].join(','),
};
const Assignee = styled.span`
  flex: 1;
  white-space: nowrap;
  flex-shrink: 1;
  flex-grow: 0;
  flex-basis: content;
  font-variant: small-caps;
  font-size: 0.8rem;
  color: rgba(180, 180, 180, 1.0);
  text-align: center;
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
  border: 0.1rem solid #555;
  border-radius: 0.25rem;
  margin-right: 0.5rem;
`;

const DueDate = styled.span`
  flex: 1;
  white-space: nowrap;
  flex-shrink: 1;
  flex-grow: 0;
  flex-basis: content;
  font-variant: small-caps;
  font-size: 0.8rem;
  color: rgba(255, 200, 200, 1.0);
  text-align: center;
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
  border: 0.1rem solid #666;
  border-radius: 0.25rem;
  margin-right: 0.5rem;
`;

url.search = new URLSearchParams(params);

const opts = {};
if (config.username && config.password) {
  const auth = base64.encode(`${config.username}:${config.password}`);
  const headers = {
    Authorization: `Basic ${auth}`,
  };
  opts.headers = headers;
}

export const command = dispatch => fetch(url, opts)
  .then((response) => {
    if (!response.ok) {
      throw Error(`${response.status} ${response.statusText} - ${url}`);
    }
    return response.json();
  })
  .then(data => dispatch({ type: 'FETCH_SUCCEEDED', data }))
  .catch(error => dispatch({ type: 'FETCH_FAILED', error }));

export const updateState = (event, previousState) => {
  switch (event.type) {
    case 'FETCH_SUCCEEDED': return event.data;
    case 'FETCH_FAILED': return { error: event.error.message };
    default: return previousState;
  }
};

const Issue = ({
  issuekey,
  summary,
  issuetype,
  status,
  assignee,
  duedate,
}) => {
  const issueLink = `https://${config.jira_domain}/browse/${issuekey}`;
  const assigneeName = assignee ? assignee.displayName : 'Unassigned';
  const dueDateDisplay = duedate ? new Date(duedate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '';
  return (
    <Item>
      <ItemLink href={issueLink}>
        <Type src={issuetype.iconUrl} />
        <Key>{issuekey.toLowerCase()}</Key>
        <Status statusName={status.name}>{status.name.toLowerCase()}</Status>
        <Assignee>{assigneeName}</Assignee>
        <Summary>{summary}</Summary>
        {duedate && <DueDate>{dueDateDisplay}</DueDate>}
      </ItemLink>
    </Item>
  );
};

/*
Issue.propTypes = {
  issuekey: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  issuetype: PropTypes.object.isRequired,
  status: PropTypes.object.isRequired
};
*/

export const render = ({ issues = [], error = '' }) => (
  error ? (
    <div>
      {`Error retrieving JIRA filter ${config.filter}: ${error}`}
    </div>
  ) : (
    <IssueList>
      {issues.map(({ key, fields }) => (<Issue key={key} issuekey={key} {...fields} />))}
    </IssueList>
  )
);

/*
render.propTypes = {
  error: PropTypes.string,
  issues: PropTypes.arrayOf(PropTypes.Object)
};

render.defaultProps = {
  error: '',
  issues: []
};
*/
