def diff_list(before: list, after: list, key: str = "content"):
    before_values = [x.get(key) for x in before if isinstance(x, dict) and key in x and x.get(key) is not None]
    after_values  = [x.get(key) for x in after  if isinstance(x, dict) and key in x and x.get(key) is not None]

    before_set = set(before_values)
    after_set  = set(after_values)

    deleted = before_set - after_set
    added   = after_set - before_set

    deleted_items = [item for item in before if isinstance(item, dict) and item.get(key) in deleted]
    added_items   = [item for item in after  if isinstance(item, dict) and item.get(key) in added]

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