# Program 승인/반려 시 상호 정보 초기화

## 작업 정보

- **작업 일자**: 2025-12-24
- **작업 담당**: hjj240228mz
- **관련 이슈**: #152
- **관련 PR**: #153

---

## 1. 배경

Program 엔티티에서 `approve()` → `reject()` → `approve()` 등 상태 전환이 반복될 경우, 이전 상태의 정보가 남아있는 문제가 있었음.

예를 들어:
1. Program이 승인됨 (`approvedBy`, `approvedAt`, `approvalComment` 설정)
2. 이후 반려됨 (`rejectionReason`, `rejectedAt` 설정)
3. 다시 승인됨 → 이때 반려 정보가 여전히 남아있음

이로 인해 데이터 일관성 문제 및 UI에서 잘못된 정보 표시 가능성이 있었음.

---

## 2. 변경 내용

### Program.java

#### approve() 메서드
```java
public void approve(Long operatorId, String comment) {
    if (this.status != ProgramStatus.PENDING) {
        throw new InvalidProgramStatusException(this.status, "승인");
    }
    this.status = ProgramStatus.APPROVED;
    this.approvedBy = operatorId;
    this.approvedAt = Instant.now();
    this.approvalComment = comment;

    // 반려 정보 초기화 (추가됨)
    this.rejectionReason = null;
    this.rejectedAt = null;
}
```

#### reject() 메서드
```java
public void reject(Long operatorId, String reason) {
    if (this.status != ProgramStatus.PENDING) {
        throw new InvalidProgramStatusException(this.status, "반려");
    }
    this.status = ProgramStatus.REJECTED;
    this.rejectionReason = reason;
    this.rejectedAt = Instant.now();

    // 승인 정보 초기화 (추가됨)
    this.approvedBy = null;
    this.approvedAt = null;
    this.approvalComment = null;
}
```

---

## 3. 상태 전환 시 필드 관리

| 동작 | 설정되는 필드 | 초기화되는 필드 |
|------|-------------|----------------|
| `approve()` | approvedBy, approvedAt, approvalComment | rejectionReason, rejectedAt |
| `reject()` | rejectionReason, rejectedAt | approvedBy, approvedAt, approvalComment |

---

## 4. 효과

- **데이터 일관성**: 현재 상태에 해당하는 정보만 유지
- **UI 정확성**: 승인된 Program에 반려 사유가 표시되는 문제 해결
- **코드 명확성**: 상태 전환 로직이 명시적으로 이전 정보 정리

---

## 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `Program.java` | approve(), reject() 메서드에 상호 정보 초기화 로직 추가 (+9줄) |

---

**작성**: hjj240228mz
**검토 완료**: 2025-12-24
