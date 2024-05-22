// 自定義可預期發生的錯誤

const appError = (httpStatus,errMessage,next)=>{
    const error = new Error(errMessage);
    error.statusCode = httpStatus;
    error.isOperational = true; // 這個錯誤是預期發生
    return error; // 回傳上方自定義的錯誤
}

module.exports = appError;