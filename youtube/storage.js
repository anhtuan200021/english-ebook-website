window.TBStore={
 async open(){return new Promise((resolve,reject)=>{const r=indexedDB.open('tuanbong-study',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Trình duyệt chưa cho lưu dữ liệu. Kiểm tra chế độ riêng tư hoặc dung lượng.'));});},
 async get(){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('data','readonly'),r=tx.objectStore('data').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('Chưa đọc được dữ liệu đã lưu.'));tx.oncomplete=()=>db.close();});},
 async set(data){const db=await this.open();return new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(data,'state');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=tx.onerror=()=>{db.close();reject(Error('Chưa lưu được. Hãy xuất bản sao để giữ dữ liệu và kiểm tra dung lượng trình duyệt.'));};});}
};
