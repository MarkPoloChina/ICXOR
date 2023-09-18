export class UtilDate {
  // Get ISO from Date CST shaped as YYYY-MM-DD or YYYYMMDD or YYYY/MM/DD (for CST)
  static getISOFromDateCST(string: string) {
    if (/^(\d\d\d\d)-(\d\d)-(\d\d)$/.test(string)) {
      const date = new Date(`${string}T00:00:00+08:00`)
      return date.toISOString()
    }
    else if (/^(\d\d\d\d\d\d\d\d)$/.test(string)) {
      const date = new Date(
        `${string.slice(0, 4)}-${string.slice(4, 6)}-${string.slice(
          6,
          8,
        )}T00:00:00+08:00`,
      )
      return date.toISOString()
    }
    else if (/^(\d\d\d\d)\/(\d\d)\/(\d\d)$/.test(string)) {
      const date = new Date(`${string.replace(/[/]/g, '-')}T00:00:00+08:00`)
      return date.toISOString()
    }
    else { return null }
  }

  // Get Date CST shaped as YYYY${desp}MM${desp}DD from a Date Object
  static getDateCST(date: Date, desp: string) {
    const str = date.toISOString()
    const _date = new Date(str.replace('Z', '-08:00'))
    return _date.toISOString().slice(0, 10).replace(/[-]/g, desp)
  }

  // Get Date JST shaped as YYYY${desp1}MM${desp1}DD${desp2}hh${desp3}mm${desp3}dd from a Date Object
  static getDateTimeJST(date: Date, desp1: string, desp2: string, desp3: string) {
    const str = date.toISOString()
    const _date = new Date(str.replace('Z', '-09:00'))
    return _date
      .toISOString()
      .slice(0, 19)
      .replace(/[-]/g, desp1)
      .replace('T', desp2)
      .replace(/[:]/g, desp3)
  }
}
