function handleSuccess(res, data) {
  res.send({
    status: "success",
    data,
  });
  res.end();
}
module.exports = handleSuccess;
