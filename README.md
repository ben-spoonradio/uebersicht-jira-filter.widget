# JIRA & Confluence Widget for Übersicht

Übersicht용 JIRA 필터 및 Confluence 페이지 위젯입니다. JIRA의 JQL 필터를 통해 이슈들을, Confluence 페이지를 실시간으로 데스크톱에 표시합니다.

## 주요 기능

### JIRA
- **JIRA 필터 연동**: JQL 필터를 통한 이슈 목록 표시
- **실시간 업데이트**: 30분마다 자동 갱신
- **시각적 상태 표시**: 이슈 상태별 색상 구분
- **상세 정보 표시**: 이슈 키, 상태, 담당자, 요약, 마감일 표시
- **클릭 가능한 링크**: 이슈를 클릭하여 JIRA로 이동

### Confluence
- **다양한 페이지 표시 모드**: 특정 페이지, 스페이스 페이지, 오늘 날짜 자동 탐색
- **본문 렌더링**: Confluence 페이지 본문을 마크다운 스타일로 표시
- **체크리스트 지원**: Confluence 작업 목록 렌더링
- **날짜/시간 표시**: Confluence 날짜 매크로 지원

### 공통
- **탭 전환**: JIRA/Confluence 탭 클릭으로 전환 (자동 전환 또는 수동 선택)
- **스크롤 지원**: 긴 콘텐츠는 스크롤 가능

## 설치 방법

1. 위젯을 Übersicht 위젯 폴더에 추가합니다.
2. `config.json.example`을 복사하여 `config.json` 파일을 생성합니다.
3. JIRA 및 Confluence 설정을 입력합니다.

## 설정 파일 (config.json)

```json
{
  "jira_domain": "your-domain.atlassian.net",
  "jira_filter": "12345",
  "username": "your-email@example.com",
  "password": "your-api-token",
  "startAt": 0,
  "maxResults": 20,
  "confluence_enabled": true,
  "confluence_space_key": "DEV",
  "confluence_mode": "auto_today",
  "confluence_parent_page_id": "1234567890",
  "confluence_max_results": 10
}
```

### JIRA 설정

| 설정 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `jira_domain` | ✅ | - | JIRA 도메인 (예: "company.atlassian.net") |
| `jira_filter` | ✅ | - | 필터 ID (JIRA 필터 URL에서 확인) |
| `username` | ❌ | - | JIRA 사용자명 (이메일) |
| `password` | ❌ | - | JIRA API 토큰 |
| `startAt` | ❌ | 0 | 시작 인덱스 |
| `maxResults` | ❌ | 20 | 최대 결과 수 |

### Confluence 설정

| 설정 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `confluence_enabled` | ❌ | false | Confluence 탭 활성화 |
| `confluence_space_key` | ❌ | "DEV" | 스페이스 키 |
| `confluence_mode` | ❌ | "space_pages" | 표시 모드 (아래 참조) |
| `confluence_page_id` | ❌ | null | 특정 페이지 ID (`specific_page` 모드용) |
| `confluence_parent_page_id` | ❌ | null | 부모 페이지 ID (`auto_today` 모드용) |
| `confluence_max_results` | ❌ | 10 | 최대 결과 수 |

### Confluence 표시 모드

| 모드 | 설명 |
|------|------|
| `space_pages` | 스페이스 내 최근 수정된 페이지 목록 표시 |
| `specific_page` | `confluence_page_id`로 지정한 특정 페이지 1개 표시 |
| `auto_today` | `confluence_parent_page_id`의 손자 페이지 중 오늘 날짜에 해당하는 페이지 자동 탐색 |

#### `auto_today` 모드 탐색 로직

1. 부모 페이지의 자식 → 각 자식의 자식(손자) 페이지 수집
2. 생성일 기준 최신순 정렬
3. 오늘 날짜 매칭 (우선순위):
   - 제목에 `week {현재주차}` 또는 `주차 {현재주차}` 포함
   - 제목/본문에 `{월}월...{일}일` 패턴 포함
   - 최근 7일 이내 날짜 패턴 (`{월}월...{일}일...(요일)`)
4. 매칭 없으면 가장 최근 손자 페이지 표시

## 필터 ID / 페이지 ID 찾기

### JIRA 필터 ID
JIRA 필터 URL에서 ID를 확인할 수 있습니다:
```
https://your-domain.atlassian.net/issues/?filter=17531
→ 필터 ID는 17531
```

### Confluence 페이지 ID
Confluence 페이지 URL에서 ID를 확인할 수 있습니다:
```
https://your-domain.atlassian.net/wiki/spaces/SPACE/pages/1234567890/Page+Title
→ 페이지 ID는 1234567890
```

## 상태별 색상 (JIRA)

| 상태 | 색상 |
|------|------|
| 완료/Done/Closed | 초록색 (lightgreen) |
| 진행중/In Progress | 파란색 (lightskyblue) |
| 검토/Review | 노란색 (gold) |
| 기타 | 회색 |

## 탭 전환

- **수동 전환**: 탭 클릭 시 선택 상태가 localStorage에 저장됨
- **자동 전환**: 수동 선택이 없으면 1분마다 JIRA ↔ Confluence 자동 전환

## Übersicht 접근성 설정

Übersicht에서 위젯 클릭을 활성화하려면:

1. **시스템 환경설정** > **보안 및 개인정보 보호** > **개인정보 보호** > **손쉬운 사용**
2. Übersicht를 앱 목록에 추가
3. Übersicht 환경설정에서 **Interaction Shortcut** 설정

설정 완료 후 설정된 단축키를 누른 상태에서 이슈나 페이지를 클릭하면 기본 브라우저에서 열립니다.

## 기술 스택

- React (JSX)
- styled-components (uebersicht)
- JIRA REST API v3
- Confluence REST API
- base64 인코딩 (인증)
