def count_index(list_items, index_field):
    count = {}
    for item in list_items:
        for idx in getattr(item, index_field):
            count[str(idx)] = count.get(str(idx), 0) + 1
    return count

def diff_list(before, after, key='content'):
    before_set = set(getattr(x, key) for x in before)
    after_set = set(getattr(x, key) for x in after)
    deleted = [x for x in before if getattr(x, key) not in after_set]
    new = [x for x in after if getattr(x, key) not in before_set]
    return deleted, new
