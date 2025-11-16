def diff_list(before: list, after: list, key: str = "content"):
    
    # === 수정된 부분 ===
    # getattr(x, key) 대신 x[key]를 사용하여 딕셔너리 값에 접근합니다.
    before_set = set(x[key] for x in before)
    after_set = set(x[key] for x in after)
    # === 수정 완료 ===

    deleted = before_set - after_set
    added = after_set - before_set

    # 원래 딕셔너리 구조를 유지하며 반환
    deleted_items = [item for item in before if item[key] in deleted]
    added_items = [item for item in after if item[key] in added]

    return deleted_items, added_items