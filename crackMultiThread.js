const { Worker, isMainThread, parentPort } = require('worker_threads');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length
const fs = require('fs');
const bcrypt = require('bcrypt');

const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function* pwsOfLen(n){
  if(n==1) yield* alphabet
  else{
    for(let ch1 of pwsOfLen(1)){
      for(let ch2 of pwsOfLen(n-1)) yield ch1 + ch2
    }
  }
}

function readData(){
    return fs.readFileSync('peer.2K.hashes.txt').toString().split('\n')
}

if (isMainThread) {
    //const [, , qty] = process.argv.map(Number)
    const splitQty = 2000 / numCPUs;

    console.time(`${numCPUs} cores sync`)
    for (let i = 0; i < numCPUs; i++) {
        const worker = new Worker(__filename);
        let msg = { id: i, start: Math.round(i * splitQty), end: Math.round(i * splitQty + splitQty) }
 
        worker.postMessage(msg);
        worker.on('message', data => {
            fs.appendFileSync('hashes.answers.txt', `${data}\n`)
        })
    }
    console.timeEnd(`${numCPUs} cores sync`)
} 
else { //worker
    parentPort.on('message', ({ id, start, end }) => {

        //common passwords to compare
        let commonPasswords = JSON.parse(fs.readFileSync('mcupws.json'));
    
        //empty string to compare
        let emptyString = ''
    
        //1ch to compare
        let oneCh = []
        for(let word of pwsOfLen(1)){
            oneCh.push(word)
        }
    
        //2ch to compare
        let twoCh = []
        for(let word of pwsOfLen(2)){
            twoCh.push(word)
        }
    
        //3ch to compare
        let threeCh = []
        for(let word of pwsOfLen(3)){
            threeCh.push(word)
        }

        let hashes = readData()
    
        let found = false;

        for(let i = start; i < end; i++){
            parentPort.postMessage(`${i}`)
            // found = false;
            // if(i != 2000 || i != 2001) {

            //     if(bcrypt.compareSync(emptyString, hashes[i])){
            //         found = true;
            //         parentPort.postMessage(`${hashes[i]} ${emptyString}`)
            //     }
            //     if(found == false){
            //         for(let ch of oneCh){
            //             if(bcrypt.compareSync(ch, hashes[i])){
            //                 found = true;
            //                 parentPort.postMessage(`${hashes[i]} ${ch}`)
            //                 break;
            //             }
            //         }
            //     }
            //     if(found == false){
            //         for(let ch of twoCh){
            //             if(bcrypt.compareSync(ch, hashes[i])){
            //                 found = true;
            //                 parentPort.postMessage(`${hashes[i]} ${ch}`)
            //                 break;
            //             }
            //         }
            //     }
            //     if(found == false){
            //         for(let pass of commonPasswords ){
            //             if(bcrypt.compareSync(pass, hashes[i])){
            //                 found = true;
            //                 parentPort.postMessage(`${hashes[i]} ${pass}`)
            //                 break;
            //             }
            //         }
            //     }
            //     if(found == false){
            //         for(let ch of threeCh){
            //             if(bcrypt.compareSync(ch, hashes[i])){
            //                 found = true;
            //                 parentPort.postMessage(`${hashes[i]} ${ch}`)
            //                 break;
            //             }
            //         }
            //     }
            // }
        }
        process.exit()
    })
}