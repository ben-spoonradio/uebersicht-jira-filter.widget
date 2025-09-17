# JIRA Filter Widget for Übersicht

Übersicht용 JIRA 필터 위젯입니다. JIRA의 JQL 필터를 통해 이슈들을 실시간으로 데스크톱에 표시합니다.

## 주요 기능

- **JIRA 필터 연동**: JQL 필터를 통한 이슈 목록 표시
- **실시간 업데이트**: 30분마다 자동 갱신
- **시각적 상태 표시**: 이슈 상태별 색상 구분
- **상세 정보 표시**: 이슈 키, 상태, 담당자, 요약, 마감일 표시
- **클릭 가능한 링크**: 이슈를 클릭하여 JIRA로 이동

## 설치 방법

1. 위젯을 Übersicht 위젯 폴더에 추가합니다.
2. `config.json` 파일을 생성하고 JIRA 설정을 입력합니다.

### 설정 파일 (config.json)

```json
{
  "jira_domain": "your-domain.atlassian.net",
  "jira_filter": "12345",
  "username": "your-email@example.com",
  "password": "your-api-token",
  "startAt": 0,
  "maxResults": 20
}
```

#### 필수 설정
- `jira_domain`: JIRA 도메인 (예: "company.atlassian.net")
- `jira_filter`: 필터 ID (JIRA 필터 URL에서 확인 가능)

#### 선택 설정
- `username`: JIRA 사용자명 (이메일)
- `password`: JIRA API 토큰
- `startAt`: 시작 인덱스 (기본값: 0)
- `maxResults`: 최대 결과 수 (기본값: 20)

### 필터 ID 찾기

JIRA 필터 URL에서 ID를 확인할 수 있습니다:
`https://your-domain.atlassian.net/issues/?filter=17531`
→ 필터 ID는 `17531`

## 상태별 색상

- **완료/Done**: 초록색 (lightgreen)
- **진행중/In Progress**: 파란색 (lightskyblue)
- **검토/Review**: 노란색 (gold)
- **기타**: 회색 (기본)

## Übersicht 접근성 설정

Übersicht에서 위젯 클릭을 활성화하려면:

1. **시스템 환경설정** > **보안 및 개인정보 보호** > **개인정보 보호** > **손쉬운 사용**
2. Übersicht를 앱 목록에 추가
3. Übersicht 환경설정에서 **Interaction Shortcut** 설정

설정 완료 후 설정된 단축키를 누른 상태에서 JIRA 키나 요약을 클릭하면 기본 브라우저에서 해당 이슈가 열립니다.

## 기술 스택

- React (JSX)
- uebersicht (스타일링)
- JIRA REST API v3
- base64 인코딩 (인증)
