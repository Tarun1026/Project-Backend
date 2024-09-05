class ApiError extends Error{
    constructor(
        statusCode,
        message="Something wrong",
        errors=[],
        stack="",
    ){
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.errors=errors
        this.stack=stack

        if (stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ApiError}