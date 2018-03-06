export class ObjectUtil {
  static pluckAllObjectsWithKey(obj, expectedKey, list: any) {
    if (typeof list === 'undefined') {
      list = [];
    }
    if (ObjectUtil.isArray(obj)) {
      obj.forEach((item) => ObjectUtil.pluckAllObjectsWithKey(item, expectedKey, list));
    } else if (ObjectUtil.isObject(obj)) {
      for (let objKey in obj) {
        let value = obj[objKey];
        if (objKey === expectedKey) {
          list.push(value);
        } else if (ObjectUtil.isObject(value)) {
          ObjectUtil.pluckAllObjectsWithKey(value, expectedKey, list);
        }
      }
    }

    return list;
  }

  static pluckAllChildObjects(obj) {

  }

  static isArray(obj) {
    return Array.isArray(obj);
  }

  static isObject(obj) {
    return typeof obj === 'object';
  }
}
