// Using browser built-in btoa instead of base-64 module
import { styled } from 'uebersicht';
import _config from './config.json';

const defaults = {
  startAt: 0,
  maxResults: 20,
  confluence_enabled: false,
  confluence_space_key: "DEV",
  confluence_page_id: null,
  confluence_mode: "space_pages",
  confluence_max_results: 10,
};

const config = Object.assign({}, defaults, _config);

export const refreshFrequency = 1.8e6; // 30m

// Keyboard shortcut to switch tabs
export const command = dispatch => {
  // Check if shift+tab keys are pressed to switch tabs
  // For now, we'll default to showing JIRA first and cycle through
  const showConfluence = Math.floor(Date.now() / 60000) % 2 === 1; // Switch every minute for demo

  // Fetch JIRA data
  const jiraPromise = fetch(url, opts)
    .then((response) => {
      if (!response.ok) {
        throw Error(`JIRA: ${response.status} ${response.statusText} - ${url}`);
      }
      return response.json();
    })
    .then(data => ({ type: 'jira', data }))
    .catch(error => ({ type: 'jira', error }));

  // Fetch Confluence data if enabled
  const confluencePromise = config.confluence_enabled ?
    fetch(confluenceUrl, opts)
      .then((response) => {
        if (!response.ok) {
          throw Error(`Confluence: ${response.status} ${response.statusText} - ${confluenceUrl}`);
        }
        return response.json();
      })
      .then(data => {
        // Debug: Log the received data
        console.log('Confluence API Response:', JSON.stringify(data, null, 2));

        // If fetching specific page, wrap it in results array format
        if (config.confluence_mode === 'specific_page' && config.confluence_page_id) {
          return { type: 'confluence', data: { results: [data] } };
        }
        return { type: 'confluence', data };
      })
      .catch(error => ({ type: 'confluence', error })) :
    Promise.resolve({ type: 'confluence', data: { results: [] } });

  // Combine both requests
  Promise.all([jiraPromise, confluencePromise])
    .then(([jiraResult, confluenceResult]) => {
      dispatch({
        type: 'FETCH_SUCCEEDED',
        jira: jiraResult,
        confluence: confluenceResult,
        activeTab: config.confluence_enabled ? 'confluence' : 'jira'
      });
    })
    .catch(error => dispatch({ type: 'FETCH_FAILED', error }));
};

export const className = `
  left: 0rem;
  top: 0rem;
  color: white;
  font-family: -apple-system;
  z-index: 1;
  width: 900px;     /* 너비 설정 */
  height: 90vh;     /* 화면 높이의 90% */
  overflow: hidden;
`;

const TabContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TabHeader = styled.div`
  display: flex;
  background-color: rgba(85, 85, 85, 1.0);
  border-radius: 0.25rem 0.25rem 0 0;
  border: 0.1rem solid #999;
  border-bottom: none;
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  background: ${props => props.active ? 'rgba(135, 206, 250, 0.3)' : 'transparent'};
  color: ${props => props.active ? '#87CEFA' : '#ccc'};
  border: none;
  cursor: pointer;
  font-family: -apple-system;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(135, 206, 250, 0.2);
    color: #87CEFA;
  }
`;

const TabContent = styled.div`
  display: ${props => props.active ? 'block' : 'none'};
`;

const IssueList = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0;
  padding: 0.25rem;
  border: 0.1rem solid #999;
  border-radius: 0 0 0.25rem 0.25rem;
  background-color: rgba(85, 85, 85, 1.0);
  list-style-type: none;
`;

const PageList = styled.ul`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0;
  padding: 0.25rem;
  border: 0.1rem solid #999;
  border-radius: 0 0 0.25rem 0.25rem;
  background-color: rgba(85, 85, 85, 1.0);
  list-style-type: none;
  max-height: calc(90vh - 100px);
  overflow-y: auto;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(135, 206, 250, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(135, 206, 250, 0.7);
  }
`;

const PageItem = styled.li`
  margin: 0.25rem 0;
`;

const PageLink = styled.a`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const PageTitle = styled.span`
  flex: 2;
  color: white;
  font-size: 0.9rem;
  margin-right: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PageMeta = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.8rem;
  color: #ccc;
`;

const PageDate = styled.span`
  color: rgba(255, 215, 0, 1.0);
`;

const PageAuthor = styled.span`
  color: rgba(180, 180, 180, 1.0);
  font-size: 0.7rem;
`;

const MarkdownContent = styled.div`
  color: #ddd;
  font-size: 0.8rem;
  margin-top: 0.5rem;
  line-height: 1.6;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 800px;
  white-space: pre-line;
  word-wrap: break-word;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid #444;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(135, 206, 250, 0.5);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(135, 206, 250, 0.7);
  }

  /* Markdown-style formatting */
  h1, h2, h3, h4, h5, h6 {
    color: #87CEFA;
    margin: 1rem 0 0.5rem 0;
    font-weight: bold;
    line-height: 1.2;
  }

  h1 { font-size: 1.2rem; border-bottom: 2px solid #87CEFA; padding-bottom: 0.3rem; }
  h2 { font-size: 1.1rem; border-bottom: 1px solid #666; padding-bottom: 0.2rem; }
  h3 { font-size: 1rem; color: #FFD700; }
  h4 { font-size: 0.95rem; color: #98FB98; }
  h5 { font-size: 0.9rem; color: #DDA0DD; }
  h6 { font-size: 0.85rem; color: #F0E68C; }

  p {
    margin: 0.75rem 0;
  }

  ul, ol {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }

  li {
    margin: 0.25rem 0;
    color: #ddd;
  }

  strong, b {
    color: #FFD700;
    font-weight: bold;
  }

  em, i {
    color: #98FB98;
    font-style: italic;
  }

  code {
    background-color: rgba(255, 255, 255, 0.1);
    color: #FF6B6B;
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.75rem;
  }

  pre {
    background-color: rgba(0, 0, 0, 0.5);
    color: #ddd;
    padding: 0.75rem;
    border-radius: 0.25rem;
    border-left: 4px solid #87CEFA;
    margin: 0.75rem 0;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 0.75rem;
  }

  blockquote {
    border-left: 4px solid #666;
    margin: 0.75rem 0;
    padding-left: 1rem;
    color: #bbb;
    font-style: italic;
  }

  table {
    border-collapse: collapse;
    margin: 0.75rem 0;
    width: 100%;
  }

  th, td {
    border: 1px solid #666;
    padding: 0.4rem 0.6rem;
    text-align: left;
  }

  th {
    background-color: rgba(135, 206, 250, 0.2);
    color: #87CEFA;
    font-weight: bold;
  }

  a {
    color: #87CEFA;
    text-decoration: underline;
  }

  hr {
    border: none;
    border-top: 1px solid #666;
    margin: 1rem 0;
  }

  /* Task list styling */
  .task-list {
    margin: 0.75rem 0;
  }

  .task-item {
    display: flex;
    align-items: flex-start;
    margin: 0.5rem 0;
    padding: 0.25rem 0;
  }

  .task-checkbox {
    display: inline-block;
    width: 1.2rem;
    height: 1.2rem;
    margin-right: 0.5rem;
    font-size: 1rem;
    line-height: 1.2;
    text-align: center;
    vertical-align: top;
    flex-shrink: 0;
  }

  .task-checkbox.checked {
    color: #98FB98;
  }

  .task-checkbox.unchecked {
    color: #87CEFA;
  }

  .task-text {
    flex: 1;
    line-height: 1.4;
  }

  /* Handle task items in regular lists */
  li.task-item {
    list-style: none;
    margin-left: -1.5rem;
    padding-left: 0;
  }
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

// Confluence API setup
let confluenceUrl;
let confluenceParams = {};

if (config.confluence_mode === 'specific_page' && config.confluence_page_id) {
  // Fetch specific page
  confluenceUrl = new URL(`http://127.0.0.1:41417/https://${config.jira_domain}/wiki/rest/api/content/${config.confluence_page_id}`);
  confluenceParams = {
    expand: 'version,space,history.lastUpdated,body.storage'
  };
} else {
  // Fetch pages from space
  confluenceUrl = new URL(`http://127.0.0.1:41417/https://${config.jira_domain}/wiki/rest/api/content`);
  confluenceParams = {
    spaceKey: config.confluence_space_key,
    limit: config.confluence_max_results,
    expand: 'version,space,history.lastUpdated',
    orderby: 'history.lastUpdated desc',
    type: 'page'
  };
}

confluenceUrl.search = new URLSearchParams(confluenceParams);

const opts = {};
if (config.username && config.password) {
  const auth = btoa(`${config.username}:${config.password}`);
  const headers = {
    Authorization: `Basic ${auth}`,
  };
  opts.headers = headers;
}


export const updateState = (event, previousState) => {
  switch (event.type) {
    case 'FETCH_SUCCEEDED':
      return {
        ...previousState,
        jira: event.jira.data || { issues: [] },
        confluence: event.confluence.data || { results: [] },
        jiraError: event.jira.error ? event.jira.error.message : null,
        confluenceError: event.confluence.error ? event.confluence.error.message : null,
        activeTab: event.activeTab || previousState?.activeTab || 'confluence'
      };
    case 'FETCH_FAILED':
      return {
        ...previousState,
        error: event.error.message
      };
    case 'SWITCH_TAB':
      return {
        ...previousState,
        activeTab: event.tab
      };
    default:
      return previousState || {
        jira: { issues: [] },
        confluence: { results: [] },
        activeTab: 'confluence'
      };
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

const ConfluencePage = ({ id, title, lastUpdated, author, spaceKey, body }) => {
  const pageLink = `https://${config.jira_domain}/wiki/spaces/${spaceKey}/pages/${id}`;
  const updateDate = new Date(lastUpdated).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Convert HTML to renderable HTML with markdown-style classes
  const convertToMarkdownHTML = (htmlContent) => {
    if (!htmlContent) return '';

    // Clean and convert HTML while preserving structure for rendering
    let html = htmlContent
      // Remove script and style elements
      .replace(/<(script|style)[^>]*>.*?<\/\1>/gis, '')

      // Handle Confluence task checkboxes FIRST
      .replace(/<ac:task-list>/gi, '<div class="task-list">')
      .replace(/<\/ac:task-list>/gi, '</div>')
      .replace(/<ac:task>/gi, '<div class="task-item">')
      .replace(/<\/ac:task>/gi, '</div>')
      .replace(/<ac:task-id>([^<]*)<\/ac:task-id>/gi, '')

      // Remove any remaining task IDs or UUIDs that might appear as text
      .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '')
      .replace(/\b[0-9a-f]{32}\b/gi, '')
      .replace(/\btask-id:\s*[0-9a-f-]+/gi, '')
      .replace(/<ac:task-status>([^<]*)<\/ac:task-status>/gi, (match, status) => {
        const isComplete = status === 'complete';
        return `<span class="task-checkbox ${isComplete ? 'checked' : 'unchecked'}">${isComplete ? '✅' : '⬜'}</span>`;
      })
      .replace(/<ac:task-body[^>]*>(.*?)<\/ac:task-body>/gis, '<span class="task-text">$1</span>')

      // Handle regular task items (alternative format)
      .replace(/<li[^>]*class="[^"]*task-list-item[^"]*"[^>]*>/gi, '<li class="task-item">')
      .replace(/<input[^>]*type="checkbox"[^>]*checked[^>]*>/gi, '<span class="task-checkbox checked">✅</span>')
      .replace(/<input[^>]*type="checkbox"[^>]*>/gi, '<span class="task-checkbox unchecked">⬜</span>')

      // Handle markdown-style checkboxes that might exist
      .replace(/\[x\]/gi, '<span class="task-checkbox checked">✅</span>')
      .replace(/\[ \]/gi, '<span class="task-checkbox unchecked">⬜</span>')

      // Clean up other Confluence-specific markup
      .replace(/<ac:structured-macro[^>]*>.*?<\/ac:structured-macro>/gis, '')
      .replace(/<ac:layout[^>]*>.*?<\/ac:layout>/gis, '')

      // Convert Confluence links to regular links
      .replace(/<ac:link[^>]*><ri:page[^>]*ri:content-title="([^"]*)"[^>]*\/><\/ac:link>/gi, '<a href="#">$1</a>')

      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

      // Clean up extra whitespace but preserve structure
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

    return html;
  };

  const htmlContent = body?.storage?.value ? convertToMarkdownHTML(body.storage.value) : '';

  return (
    <PageItem>
      <PageLink href={pageLink}>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <PageTitle>{title}</PageTitle>
            <PageMeta>
              <PageDate>{updateDate}</PageDate>
              <PageAuthor>{author}</PageAuthor>
            </PageMeta>
          </div>
          {htmlContent ? (
            <MarkdownContent dangerouslySetInnerHTML={{ __html: htmlContent }} />
          ) : (
            <div style={{
              color: '#666',
              fontSize: '0.7rem',
              marginTop: '0.5rem',
              fontStyle: 'italic'
            }}>
              {body ? 'Content processing...' : 'No content available'}
            </div>
          )}
        </div>
      </PageLink>
    </PageItem>
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

export const render = (state) => {
  const {
    jira = { issues: [] },
    confluence = { results: [] },
    jiraError,
    confluenceError,
    activeTab = 'jira',
    error
  } = state || {};

  if (error) {
    return (
      <div>
        {`Error: ${error}`}
      </div>
    );
  }

  const handleTabSwitch = (tab) => {
    // Übersicht doesn't support direct event handling, but we can use a simple state approach
    // This would need to be handled differently in a real implementation
  };

  return (
    <TabContainer>
      <TabHeader>
        <Tab active={activeTab === 'jira'}>
          📋 JIRA Issues ({jira.issues?.length || 0})
        </Tab>
        {config.confluence_enabled && (
          <Tab active={activeTab === 'confluence'}>
            📄 Confluence Pages ({confluence.results?.length || 0})
          </Tab>
        )}
      </TabHeader>

      <TabContent active={activeTab === 'jira'}>
        {jiraError ? (
          <div style={{ color: '#ff6b6b', padding: '1rem' }}>
            Error loading JIRA: {jiraError}
          </div>
        ) : (
          <IssueList>
            {jira.issues?.map(({ key, fields }) => (
              <Issue key={key} issuekey={key} {...fields} />
            ))}
          </IssueList>
        )}
      </TabContent>

      {config.confluence_enabled && (
        <TabContent active={activeTab === 'confluence'}>
          {confluenceError ? (
            <div style={{ color: '#ff6b6b', padding: '1rem' }}>
              Error loading Confluence: {confluenceError}
            </div>
          ) : (
            <div>
              <div style={{ color: '#999', fontSize: '0.7rem', padding: '0.5rem', borderBottom: '1px solid #444' }}>
                Debug: {confluence.results?.length || 0} page(s) loaded | Mode: {config.confluence_mode} | Page ID: {config.confluence_page_id}
              </div>
              <PageList>
                {confluence.results?.length > 0 ? (
                  confluence.results.map((page) => (
                    <ConfluencePage
                      key={page.id}
                      id={page.id}
                      title={page.title}
                      lastUpdated={page.history?.lastUpdated?.when || page.version?.when}
                      author={page.history?.lastUpdated?.by?.displayName || page.version?.by?.displayName || 'Unknown'}
                      spaceKey={page.space?.key || config.confluence_space_key}
                      body={page.body}
                    />
                  ))
                ) : (
                  <div style={{ color: '#999', padding: '1rem', fontStyle: 'italic' }}>
                    No pages found. Check the console for API response details.
                  </div>
                )}
              </PageList>
            </div>
          )}
        </TabContent>
      )}
    </TabContainer>
  );
};

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
