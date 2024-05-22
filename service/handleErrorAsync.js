// 捕捉未定義的錯誤，並且統一在 app.js 處理

const handleErrorAsync = function handleErrorAsync(func) {

    // 簡單的解釋是 : async function 丟進參數，回傳有加上 catch 的 middleware

    // func 先將 async fun 帶入參數儲存
    // middleware 先接住 router 資料
    return function (req, res, next) {
        //再執行函式，async 可再用 catch 統一捕捉
        // func 參數的 async 本身就是 promise，所以可用 catch 去捕捉
        func(req, res, next).catch(
            function (error) {
                // return 中斷程式，並且將錯誤丟到下一個 middleware
                return next(error);
            }
        );
    };
};

module.exports = handleErrorAsync;