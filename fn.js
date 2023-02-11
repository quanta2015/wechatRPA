import clipboardy from 'clipboardy'
import dayjs from 'dayjs'
import path from 'path'
import r from 'robotjs'
import fs from 'fs'
import Jimp from "jimp"
import { iconDb } from './db.js'
import axios from 'axios'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'


const DOMAIN   = `https://m.suosishequ.com/`
const API_SAVE = `${DOMAIN}gateway/spider/api/spider/addIncrement`


const DIM      = { X:1680,Y:998 }
const p_search = { x:100, y:40  }  // 搜索框坐标
const p_item   = { x:100, y:115 }  // 搜索第一个元素坐标



// 延时函数
export const delay = ms => new Promise(r => {
  let rand = parseInt(Math.random() * 500)
  setTimeout(r, ms+rand)
})
// 格式化时间
export const formatTime =(t)=> dayjs(t).format('YYYY-MM-DD hh:mm:ss')

// 移动并点击鼠标
export const moveClick =async(p,d=2000)=>{
  r.moveMouse(p.x,p.y)
  r.mouseClick()
  await delay(d)
}

// 获取像素点色彩
export const getPixelColor=(x, y)=> {
  var robotScreen = r.getScreenSize();
  var robotx = x / robotScreen.width * DIM.X;
  var roboty = y / robotScreen.height * DIM.Y;
  return r.getPixelColor(robotx, roboty);
}


// 打开订阅号
export const openRead = async() => {
  moveClick(p_search)
  r.typeString('dyh')
  r.keyTap('enter')
  await delay(1000)
  moveClick(p_item)
  await delay(3000)
}


// 检查是否阅读过
export const checkUnread = (p,pos) => {
  let clr = getPixelColor(p.x, p.y)
  return (clr=== pos.CLR)? true:false
}


// 去掉重复元素
export const noRepeat =(list)=>{
  return list.filter((item, i) =>  list.indexOf(item) == i)
}


export const saveNews = (name,type,urls) => {
  let  data = { 
    "columnName":name,
    "accountType":type?0:1,
    "urls":urls,  
  }
  const opt = { headers: { 'Content-Type': 'application/json' }}
  axios.post(API_SAVE, data, opt).then( r => {
    if (r.data.code !== 0 ) {
      console.log(r);
    }else{
      console.log(data)
      // console.log("\n")
    }
  })
}


export const paste =()=>{
  execSync('powershell get-clipboard > clip')
  let data = readFileSync( 'clip' ,{encoding:'utf8'})
  return data
}


// 阅读公众号新闻
export const readSaveUrl = async(p,pos,name)=>{
  await moveClick(p)
  await moveClick(pos.p_news)

  let url
  let newsList = []
  for (let j = 0; j < 8; j++) {
    let np = {x:pos.p_news.x, y:pos.p_news.y + j * pos.NEWS_H}
    await moveClick(np,3000)

    //打开文件
    await moveClick({x:pos.p_copy.x, y:pos.p_copy.y},4000)
    // let url = clipboardy.readSync();
    let url = paste()
    newsList.push(url)
    await delay(2000)
  }
  newsList = noRepeat(newsList)

  saveNews(name, pos.TYPE, newsList)
  return newsList.length
}


// 滚动到顶部
export const scrollToTop =async (pos)=> {
  for (let i = 1; i<60; i++ ) {
    await moveClick(pos.p_pre,100)
  }
}


export const compare =(buf1,buf2)=> {
  let list1 = buf1.toJSON().data
  let list2 = buf2.toJSON().data
  let len = list1.length
  let count = 0

  list1.map((item,i)=>{
    if (item=== list2[i]) {
      count ++
    }
  })
  // console.log(count)
  return (count/len > 0.9)?0:1
}

export const getName =(icon,index, pos)=>{
  let ret = 'NULL'
  let type = pos.TYPE
  let db = iconDb[type]
  let find = false
  
  // for(let i=0;i<db.length;i++) {
  //   let _dir = process.cwd()
  //   let _id  = db[i].id.padStart(3,'0')
  //   let file = path.join(_dir, `icon/json/${type}/${_id}.json`) 
  //   let data = fs.readFileSync(file)
  //   let buf  = Buffer.from(JSON.parse(data).image)
  //   // let rc = Buffer.compare(icon.image, buf)
  //   let rc = compare(icon.image, buf)
  //   if (rc === 0) {
  //     ret = db[i].name
  //     find = true
  //     break;
  //   }
  // }

  let _root = process.cwd()
  let _dir = path.join(_root, `icon/json/${type}/`)
  const files = fs.readdirSync(_dir);
  for(let i=0;i<files.length;i++) {
    let fileName = `${_dir}${files[i]}`;
    let stat = fs.lstatSync(fileName);
    if (stat.isFile() === true) { 
      let data = fs.readFileSync(fileName)
      let buf  = Buffer.from(JSON.parse(data).image)
      let rc = compare(icon.image, buf)
      if (rc === 0) {
        ret = db[i].name
        find = true
        break;
      }
    }
  }

  // for(let i=0;i<db.length;i++) {
  //   let _dir = process.cwd()
  //   let _id  = db[i].id.padStart(3,'0')
  //   let file = path.join(_dir, `icon/json/${type}/${_id}.json`) 
  //   let data = fs.readFileSync(file)
  //   let buf  = Buffer.from(JSON.parse(data).image)
  //   // let rc = Buffer.compare(icon.image, buf)
  //   let rc = compare(icon.image, buf)
  //   if (rc === 0) {
  //     ret = db[i].name
  //     find = true
  //     break;
  //   }
  // }


  if (!find) {
    let { TX, TW, TH } = pos
    let _dir  = process.cwd()
    let _id = dayjs().format('YYYMMDDHHmmss')
    let _fileIcon = path.join(_dir, `err/img/${type}/${_id}icon.png`)
    let _fileText = path.join(_dir, `err/text/${type}/${_id}text.bmp`)
    let _fileJson = path.join(_dir, `err/json/${type}/${_id}data.json`)
    let text  = r.screen.capture(pos.p_icon.x+TX, pos.p_icon.y+pos.ITEM_H*index, TW, TH);
    saveIcon(icon,_fileIcon)
    saveIcon(text,_fileText)
    fs.writeFileSync(_fileJson,JSON.stringify(icon, null, 2))
  }

  return ret 
}

export const saveIcon=(pic, path)=> {
  return new Promise((resolve, reject) => {
    try {
      const image = new Jimp(pic.width, pic.height);
      let pos = 0;
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
        image.bitmap.data[idx + 2] = pic.image.readUInt8(pos++);
        image.bitmap.data[idx + 1] = pic.image.readUInt8(pos++);
        image.bitmap.data[idx + 0] = pic.image.readUInt8(pos++);
        image.bitmap.data[idx + 3] = pic.image.readUInt8(pos++);
      });
      image.write(path, resolve);
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
}



// 计算时间差
export const calcTime = (fr,to,mode=1)=> {
  let params = ['days','minutes','seconds']
  return dayjs(to).diff(dayjs(fr), params[mode])
}


// 保存数据
export const saveData =(data)=> {
  let _dir = process.cwd()
  let _file = path.join(_dir, `data/data${dayjs().format('YYYYMMDDHHmmss')}.json`)
  fs.writeFileSync(_file,JSON.stringify(data, null, 2))
}



// 根据图标判断是否到底部
export const checkEndByIcon =async(pos)=>{
  let icon_before = r.screen.capture(pos.p_icon.x, pos.p_icon.y, 14, 14);
  // 点击滚动条到下一页
  await moveClick(pos.p_next)
  let icon_after  = r.screen.capture(pos.p_icon.x, pos.p_icon.y, 14, 14);
  let rc = Buffer.compare(icon_before.image, icon_after.image)
  return (rc===0)?true:false
}

const removeItem =(list,index)=>{
  for(let i=index;i<list.length-1;i++) {
    list[i] = list[i+1]
  }
}

export const filterDb =(list)=>{

  let same = 0
  let len = list.length

  for(let i=0;i<len;i++) {

    for(let j=i+1;j<len;) {
      if (list[i].name === list[j].name) {
        console.log(list[i].id, list[j].id)
        removeItem(list,j)
        same++
        len--
      }else{
        j++
      }
    }
  }

  for(let i=0;i<same;i++) {
    list.pop()
  }

  console.table(list)

}