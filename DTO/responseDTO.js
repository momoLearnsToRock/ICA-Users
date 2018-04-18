class responseDTO {
  constructor(message, data) {
    this.message = !!message ? message : '';
    this.data = !!data ? data : null;
  }
}
module.exports = responseDTO;
