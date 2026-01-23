# Course 엔티티 필드 확장 (startDate, endDate, tags)

## 작업 정보

- **작업 일자**: 2025-12-24
- **작업 담당**: hjj240228mz
- **관련 이슈**: #169
- **관련 PR**: #178

---

## 1. 배경

Course 엔티티에 강의 기간 및 태그 정보를 저장할 필드가 필요했음:
- **startDate, endDate**: 강의 시작/종료일 관리
- **tags**: 강의 태그/키워드 (검색, 분류 용도)

---

## 2. 변경 내용

### 2.1 Course.java (Entity)

#### 신규 필드
```java
@Column
private LocalDate startDate;

@Column
private LocalDate endDate;

@ElementCollection(fetch = FetchType.EAGER)
@CollectionTable(name = "cm_course_tags", joinColumns = @JoinColumn(name = "course_id"))
@Column(name = "tag", length = 100)
private List<String> tags = new ArrayList<>();
```

#### 정적 팩토리 메서드 수정
```java
public static Course create(String title, String description, CourseLevel level,
                            CourseType type, Integer estimatedHours,
                            Long categoryId, String thumbnailUrl,
                            LocalDate startDate, LocalDate endDate, List<String> tags) {
    // ...
    course.startDate = startDate;
    course.endDate = endDate;
    course.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
    return course;
}
```

#### 업데이트 메서드
```java
public void updateStartDate(LocalDate startDate) {
    this.startDate = startDate;
}

public void updateEndDate(LocalDate endDate) {
    this.endDate = endDate;
}

public void updateTags(List<String> tags) {
    this.tags = tags != null ? new ArrayList<>(tags) : new ArrayList<>();
}
```

### 2.2 DTO 변경

#### CreateCourseRequest.java
```java
public record CreateCourseRequest(
    // 기존 필드...
    LocalDate startDate,
    LocalDate endDate,
    List<String> tags
) { }
```

#### UpdateCourseRequest.java
```java
public record UpdateCourseRequest(
    // 기존 필드...
    LocalDate startDate,
    LocalDate endDate,
    List<String> tags
) { }
```

#### CourseResponse.java / CourseDetailResponse.java
```java
public record CourseResponse(
    // 기존 필드...
    LocalDate startDate,
    LocalDate endDate,
    List<String> tags,
    // ...
) { }
```

### 2.3 Service 변경

#### CourseServiceImpl.java
- `create()`: 새 필드를 Course.create()에 전달
- `update()`: 새 필드를 Course.update()에 전달

---

## 3. DB 스키마 변경

### Course 테이블 (cm_courses)
```sql
ALTER TABLE cm_courses ADD COLUMN start_date DATE;
ALTER TABLE cm_courses ADD COLUMN end_date DATE;
```

### Tags 테이블 (신규)
```sql
CREATE TABLE cm_course_tags (
    course_id BIGINT NOT NULL,
    tag VARCHAR(100),
    FOREIGN KEY (course_id) REFERENCES cm_courses(id)
);
```

> `ddl-auto: update` 설정으로 자동 적용됨

---

## 4. API 사용 예시

### 강의 생성
```json
POST /api/courses
{
    "title": "Spring Boot 입문",
    "description": "Spring Boot 기초 강의",
    "level": "BEGINNER",
    "type": "ONLINE",
    "estimatedHours": 20,
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "tags": ["Spring", "Java", "Backend"]
}
```

### 응답
```json
{
    "success": true,
    "data": {
        "courseId": 1,
        "title": "Spring Boot 입문",
        "startDate": "2025-01-01",
        "endDate": "2025-03-31",
        "tags": ["Spring", "Java", "Backend"],
        // ...
    }
}
```

---

## 5. 테스트 업데이트

| 파일 | 변경 내용 |
|------|----------|
| CourseControllerTest.java | Course.create() 호출부에 새 파라미터 추가 |
| CourseItemControllerTest.java | Course.create() 호출부에 새 파라미터 추가 |
| CourseRelationControllerTest.java | Course.create() 호출부에 새 파라미터 추가 |
| SnapshotControllerTest.java | Course.create() 호출부에 새 파라미터 추가 |

---

## 6. 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| Course.java | startDate, endDate, tags 필드 및 메서드 추가 |
| CreateCourseRequest.java | 새 필드 추가 |
| UpdateCourseRequest.java | 새 필드 추가 |
| CourseResponse.java | 새 필드 추가 |
| CourseDetailResponse.java | 새 필드 추가 |
| CourseServiceImpl.java | create/update 메서드에 새 필드 전달 |
| CourseControllerTest.java | 테스트 코드 업데이트 |
| CourseItemControllerTest.java | 테스트 코드 업데이트 |
| CourseRelationControllerTest.java | 테스트 코드 업데이트 |
| SnapshotControllerTest.java | 테스트 코드 업데이트 |

**총 10개 파일, +128줄**

---

**작성**: hjj240228mz
**검토 완료**: 2025-12-24
