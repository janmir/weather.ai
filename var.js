'use strict',

module.exports.var = {
    URL : process.env.URL || "",
    EMAIL : process.env.EMAIL || "",
    EMAIL_REGION : process.env.EMAIL_REGION || "",
    DEPLOY : process.env.DEPLOY === "true" || false,
    DEBUG : process.env.DEBUG === "true" || false,
    YAML_FILE : process.env.YAML_FILE || "",
    BUCKET : process.env.BUCKET || "",
    JSON_FILE : process.env.JSON_FILE || "untitled",
    SEND_MAIL : process.env.SEND_MAIL === "true" || false,
}