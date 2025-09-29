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
        console.log('=== CONFLUENCE API RESPONSE ===');
        console.log('Full response:', JSON.stringify(data, null, 2));

        // Check specifically for body content
        if (data.body && data.body.storage) {
          console.log('=== BODY STORAGE CONTENT ===');
          console.log('Raw storage value:', data.body.storage.value);
          console.log('Storage value length:', data.body.storage.value?.length);

          // Look for date-related content in the raw storage
          const dateSearch = [
            /2025년/g,
            /2024년/g,
            /년.*?월.*?일/g,
            /\(월\)/g,
            /\(화\)/g,
            /\(수\)/g,
            /\(목\)/g,
            /\(금\)/g,
            /\(토\)/g,
            /\(일\)/g,
            /<ac:structured-macro/g,
            /<time/g,
            /date/gi,
            /9월.*?22일/g,
            /월.*?일.*?\(/g
          ];

          dateSearch.forEach((pattern, index) => {
            const matches = data.body.storage.value.match(pattern);
            if (matches) {
              console.log(`Pattern ${index} (${pattern}) found:`, matches);
              // Show surrounding context for date matches
              matches.forEach(match => {
                const position = data.body.storage.value.indexOf(match);
                const context = data.body.storage.value.substring(Math.max(0, position - 50), position + match.length + 50);
                console.log(`Context for "${match}":`, context);
              });
            }
          });

          // Also search for any potential Korean text that might be dates
          const koreanTextMatches = data.body.storage.value.match(/[가-힣0-9\s]+년[가-힣0-9\s()]+/g);
          if (koreanTextMatches) {
            console.log('Korean text with 년 found:', koreanTextMatches);
          }
        }

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
  font-size: 0.75rem;
  margin-top: 0.4rem;
  line-height: 1.3;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 800px;
  white-space: pre-line;
  word-wrap: break-word;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
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
    margin: 0.6rem 0 0.3rem 0;
    font-weight: bold;
    line-height: 1.1;
  }

  h1 { font-size: 1rem; border-bottom: 2px solid #87CEFA; padding-bottom: 0.2rem; }
  h2 { font-size: 0.95rem; border-bottom: 1px solid #666; padding-bottom: 0.15rem; }
  h3 { font-size: 0.9rem; color: #FFD700; }
  h4 { font-size: 0.85rem; color: #98FB98; }
  h5 { font-size: 0.8rem; color: #DDA0DD; }
  h6 { font-size: 0.75rem; color: #F0E68C; }

  p {
    margin: 0.4rem 0;
    line-height: 1.3;
  }

  ul, ol {
    margin: 0.3rem 0;
    padding-left: 1.2rem;
  }

  li {
    margin: 0.15rem 0;
    color: #ddd;
    line-height: 1.2;
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
    margin: 0.5rem 0;
    width: auto;
    font-size: 0.75rem;
    max-width: 100%;
  }

  th, td {
    border: 1px solid #666;
    padding: 0.15rem 0.3rem;
    text-align: left;
    word-wrap: break-word;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.1;
  }

  th {
    background-color: rgba(135, 206, 250, 0.2);
    color: #87CEFA;
    font-weight: bold;
    font-size: 0.65rem;
    line-height: 1;
  }

  td {
    vertical-align: top;
    font-size: 0.7rem;
  }

  /* Responsive table behavior */
  @media (max-width: 800px) {
    table {
      font-size: 0.7rem;
    }

    th, td {
      padding: 0.2rem 0.3rem;
      max-width: 150px;
    }
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
    margin: 0.4rem 0;
  }

  .task-item {
    display: flex;
    align-items: flex-start;
    margin: 0.2rem 0;
    padding: 0.1rem 0;
  }

  .task-checkbox {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    margin-right: 0.4rem;
    font-size: 0.8rem;
    line-height: 1;
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
    line-height: 1.2;
    font-size: 0.75rem;
  }

  /* Handle task items in regular lists */
  li.task-item {
    list-style: none;
    margin-left: -1.2rem;
    padding-left: 0;
  }

  /* Confluence date/time styling */
  .confluence-date,
  .confluence-time,
  .confluence-datetime {
    display: inline-block;
    background-color: rgba(135, 206, 250, 0.2);
    color: #87CEFA;
    padding: 0.1rem 0.3rem;
    border-radius: 0.2rem;
    font-size: 0.7rem;
    font-weight: bold;
    border: 1px solid rgba(135, 206, 250, 0.4);
  }

  .confluence-time {
    background-color: rgba(255, 215, 0, 0.2);
    color: #FFD700;
    border-color: rgba(255, 215, 0, 0.4);
  }

  .confluence-datetime {
    background-color: rgba(152, 251, 152, 0.2);
    color: #98FB98;
    border-color: rgba(152, 251, 152, 0.4);
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

  ${(props) => {
    const statusName = props.statusName?.toLowerCase() || "";
    if (
      statusName.includes("완료") ||
      statusName.includes("done") ||
      statusName.includes("closed")
    ) {
      return `
        color: rgba(144, 238, 144, 1.0);
        border-color: rgba(144, 238, 144, 0.5);
        background-color: rgba(144, 238, 144, 0.1);
      `;
    }
    if (
      statusName.includes("진행") ||
      statusName.includes("progress") ||
      statusName.includes("in progress")
    ) {
      return `
        color: rgba(135, 206, 250, 1.0);
        border-color: rgba(135, 206, 250, 0.5);
        background-color: rgba(135, 206, 250, 0.1);
      `;
    }
    if (
      statusName.includes("검토") ||
      statusName.includes("review") ||
      statusName.includes("reviewing")
    ) {
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
  color: rgba(200, 200, 200, 1);
  text-align: center;
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
`;

const Summary = styled.span`
  flex: 1;
  white-space: nowrap;
  padding: 0 0.5rem 0.1rem 0.25rem;
  margin: 0;
  flex-grow: 1.5; // 기존 2에서 1.5로 조정
  color: white;
  overflow: hidden;
  text-overflow: ellipsis; // 긴 텍스트 처리
`;

const url = new URL(
  `http://127.0.0.1:41417/https://${config.jira_domain}/rest/api/3/search/jql`,
);
const params = {
  jql: `filter = ${config.jira_filter}`,
  startAt: config.startAt,
  maxResults: config.maxResults,
  fields: ["summary", "status", "issuetype", "assignee", "duedate"].join(","),
};
const Assignee = styled.span`
  flex: 1;
  white-space: nowrap;
  flex-shrink: 1;
  flex-grow: 0;
  flex-basis: content;
  font-variant: small-caps;
  font-size: 0.8rem;
  color: rgba(180, 180, 180, 1);
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
  color: rgba(255, 200, 200, 1);
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

const Issue = ({ issuekey, summary, issuetype, status, assignee, duedate }) => {
  const issueLink = `https://${config.jira_domain}/browse/${issuekey}`;
  const assigneeName = assignee ? assignee.displayName : "Unassigned";
  const dueDateDisplay = duedate
    ? new Date(duedate).toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      })
    : "";
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

  // Better date handling with fallbacks and validation
  let updateDate = 'Unknown';
  if (lastUpdated) {
    try {
      const date = new Date(lastUpdated);
      if (!isNaN(date.getTime())) {
        updateDate = date.toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      console.log('Date parsing error:', error, 'for date:', lastUpdated);
    }
  }

  // Debug: Log the raw date data
  console.log('Date debug:', { lastUpdated, updateDate });

  // Debug: Log raw HTML content for troubleshooting
  if (body?.storage?.value) {
    console.log('Raw HTML sample:', body.storage.value.substring(0, 1000));
    // Look for specific patterns that might contain dates
    const datePatterns = [
      /2025년.*?월.*?일/g,
      /<ac:structured-macro[^>]*ac:name="date"[^>]*>.*?<\/ac:structured-macro>/g,
      /<time[^>]*>.*?<\/time>/g,
      /<span[^>]*date[^>]*>.*?<\/span>/g
    ];

    datePatterns.forEach((pattern, index) => {
      const matches = body.storage.value.match(pattern);
      if (matches) {
        console.log(`Date pattern ${index} matches:`, matches);
      }
    });
  }

  // Convert HTML to renderable HTML with markdown-style classes
  const convertToMarkdownHTML = (htmlContent) => {
    if (!htmlContent) return '';

    // Clean and convert HTML while preserving structure for rendering
    let html = htmlContent
      // Remove script and style elements
      .replace(/<(script|style)[^>]*>.*?<\/\1>/gis, '')

      // Handle ALL types of Confluence date components
      .replace(/<ac:structured-macro[^>]*ac:name="date"[^>]*>(.*?)<\/ac:structured-macro>/gis, (match, content) => {
        console.log('Date macro found:', match);
        // Extract date value from parameters
        const valueMatch = content.match(/<ac:parameter[^>]*ac:name="value"[^>]*>([^<]*)<\/ac:parameter>/i);
        if (valueMatch) {
          const dateValue = valueMatch[1];
          try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              return `<span class="confluence-date">${date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>`;
            }
          } catch (e) {
            console.log('Date macro parsing error:', e);
          }
        }
        return `<span class="confluence-date">[Date Component]</span>`;
      })

      // Handle inline date elements (alternative format)
      .replace(/<time[^>]*datetime="([^"]*)"[^>]*>([^<]*)<\/time>/gi, (match, datetime, content) => {
        console.log('Time element found:', match);
        if (content && content.trim()) {
          return `<span class="confluence-date">${content}</span>`;
        }
        try {
          const date = new Date(datetime);
          if (!isNaN(date.getTime())) {
            return `<span class="confluence-date">${date.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>`;
          }
        } catch (e) {
          console.log('Time element parsing error:', e);
        }
        return `<span class="confluence-date">[Time Element]</span>`;
      })

      // Handle Confluence Rich Text date formats
      .replace(/<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]*)<\/span>/gi, (match, content) => {
        console.log('Date span found:', match);
        return `<span class="confluence-date">${content}</span>`;
      })

      // Handle data-* attributes that might contain dates
      .replace(/<[^>]*data-date="([^"]*)"[^>]*>([^<]*)<\/[^>]*>/gi, (match, dateValue, content) => {
        console.log('Data-date found:', match);
        if (content && content.trim()) {
          return `<span class="confluence-date">${content}</span>`;
        }
        return `<span class="confluence-date">[Data Date]</span>`;
      })

      // Handle time macros
      .replace(/<ac:structured-macro[^>]*ac:name="time"[^>]*>(.*?)<\/ac:structured-macro>/gis, (match, content) => {
        const valueMatch = content.match(/<ac:parameter[^>]*ac:name="value"[^>]*>([^<]*)<\/ac:parameter>/i);
        if (valueMatch) {
          const timeValue = valueMatch[1];
          try {
            const time = new Date(`1970-01-01T${timeValue}`);
            if (!isNaN(time.getTime())) {
              return `<span class="confluence-time">${time.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}</span>`;
            }
          } catch (e) {
            console.log('Time macro parsing error:', e);
          }
        }
        return `<span class="confluence-time">[Time]</span>`;
      })

      // Handle datetime macros
      .replace(/<ac:structured-macro[^>]*ac:name="datetime"[^>]*>(.*?)<\/ac:structured-macro>/gis, (match, content) => {
        const valueMatch = content.match(/<ac:parameter[^>]*ac:name="value"[^>]*>([^<]*)<\/ac:parameter>/i);
        if (valueMatch) {
          const datetimeValue = valueMatch[1];
          try {
            const datetime = new Date(datetimeValue);
            if (!isNaN(datetime.getTime())) {
              return `<span class="confluence-datetime">${datetime.toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>`;
            }
          } catch (e) {
            console.log('DateTime macro parsing error:', e);
          }
        }
        return `<span class="confluence-datetime">[DateTime]</span>`;
      })

      // Handle Confluence task checkboxes
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

      // Clean up other Confluence-specific markup (but preserve content)
      .replace(/<ac:structured-macro[^>]*ac:name="(?!date|time|datetime)[^"]*"[^>]*>(.*?)<\/ac:structured-macro>/gis, (match, content) => {
        console.log('Other macro removed:', match.substring(0, 100));
        return content;
      })
      .replace(/<ac:layout[^>]*>(.*?)<\/ac:layout>/gis, '$1')
      .replace(/<ac:layout-section[^>]*>(.*?)<\/ac:layout-section>/gis, '$1')
      .replace(/<ac:layout-cell[^>]*>(.*?)<\/ac:layout-cell>/gis, '$1')

      // Clean up remaining Confluence tags while preserving content
      .replace(/<ac:([^>]*)>(.*?)<\/ac:\1>/gis, (match, tagName, content) => {
        console.log('AC tag removed:', tagName, 'content:', content.substring(0, 50));
        return content;
      })

      // Convert Confluence links to regular links
      .replace(/<ac:link[^>]*><ri:page[^>]*ri:content-title="([^"]*)"[^>]*\/><\/ac:link>/gi, '<a href="#">$1</a>')

      // Handle parentheses and special characters that might be getting lost
      .replace(/\(/g, '(')
      .replace(/\)/g, ')')
      .replace(/（/g, '(')
      .replace(/）/g, ')')

      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#40;/g, '(')
      .replace(/&#41;/g, ')')

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
                {confluence.results?.length > 0 && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.6rem' }}>
                    <div>API Response Keys: {Object.keys(confluence.results[0] || {}).join(', ')}</div>
                    <div>Body available: {confluence.results[0]?.body ? 'Yes' : 'No'}</div>
                    <div>Storage available: {confluence.results[0]?.body?.storage ? 'Yes' : 'No'}</div>
                    <div>Content length: {confluence.results[0]?.body?.storage?.value?.length || 0}</div>
                    {confluence.results[0]?.body?.storage?.value && (
                      <div style={{ marginTop: '0.25rem', maxHeight: '100px', overflow: 'auto', background: 'rgba(0,0,0,0.5)', padding: '0.25rem', fontSize: '0.5rem' }}>
                        Raw content preview: {confluence.results[0].body.storage.value.substring(0, 500)}...
                      </div>
                    )}
                  </div>
                )}
              </div>
              <PageList>
                {confluence.results?.length > 0 ? (
                  confluence.results.map((page) => (
                    <ConfluencePage
                      key={page.id}
                      id={page.id}
                      title={page.title}
                      lastUpdated={
                        page.history?.lastUpdated?.when ||
                        page.version?.when ||
                        page.history?.createdDate ||
                        page.version?.createdDate ||
                        page.createdDate
                      }
                      author={
                        page.history?.lastUpdated?.by?.displayName ||
                        page.version?.by?.displayName ||
                        page.history?.createdBy?.displayName ||
                        page.version?.createdBy?.displayName ||
                        page.createdBy?.displayName ||
                        'Unknown'
                      }
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
