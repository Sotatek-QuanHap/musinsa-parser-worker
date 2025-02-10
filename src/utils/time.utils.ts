export class TimeUtils {
  static async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
