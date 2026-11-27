const fs=require('node:fs'),crypto=require('node:crypto');
const data=fs.readFileSync(__dirname+'/project-source.enc');
const key=crypto.pbkdf2Sync(fs.readFileSync(0,'utf8').trim(),data.subarray(0,16),600000,32,'sha256');
const cipher=crypto.createDecipheriv('aes-256-gcm',key,data.subarray(16,28));
cipher.setAuthTag(data.subarray(-16));
const archive=Buffer.concat([cipher.update(data.subarray(28,-16)),cipher.final()]);
process.stdout.write(archive);
