var halson = require("halson"),
           _ = require("underscore")
   module.exports = {
           makeHAL: makeHAL,
           setupRoutes: setupRoutes,
           validateKey: validateKey
}
   function setupRoutes(server, swagger, lib) {
           for(controller in lib.controllers) {
                   cont = lib.controllers[controller](lib)
                   cont.setUpActions(server, swagger)
} }
function validateKey(hmacdata, key, lib) {
    //This is for testing the swagger-ui, should be removed after development to avoid possible security problem :)
    if(+key == 777) return true
    var hmac = require("crypto").createHmac("md5", lib.config.secretKey)
    .update(hmacdata)
    .digest("hex");
    //TODO: Remove this line
    console.log(hmac)
    return hmac == key
}
function makeHAL(data, links, embed) {
    var obj = halson(data)
if(links && links.length > 0) {
    _.each(links, function(lnk) {
            obj.addLink(lnk.name, {
                    href: lnk.href,
                    title: lnk.title || ''
}) })
}
if(embed && embed.length > 0) {
    _.each(embed, function (item) {
            obj.addEmbed(item.name, item.data)
}) 
}
return obj
}