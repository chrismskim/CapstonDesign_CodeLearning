def diff_list(before: list, after: list, key: str = "content"):
    
    # === 수정된 부분 ===
    before_set = set(x[key] for x in before)
    after_set = set(x[key] for x in after)
    # === 수정 완료 ===

    deleted = before_set - after_set
    added = after_set - before_set

    # 원래 딕셔너리 구조를 유지하며 반환
    deleted_items = [item for item in before if item[key] in deleted]
    added_items = [item for item in after if item[key] in added]

    return deleted_items, added_items

def count_index(items: list, key: str):
    """
    리스트 내의 딕셔너리에서 주어진 키(리스트 형태)의 인덱스 값들의 개수를 셉니다.
    예: [{"risk_index_list": [1, 2]}, {"risk_index_list": [1]}] -> {"1": 2, "2": 1}
    """
    counts = {}
    if not items:
        return counts
    
    for item in items:
        # 딕셔너리에서 키로 값 가져오기
        index_list = item.get(key, []) 
        if not isinstance(index_list, list):
             continue
        for index in index_list:
            # 개수를 문자열 키로 저장 (result_service.py의 사용 방식과 일치)
            counts[str(index)] = counts.get(str(index), 0) + 1
    return counts