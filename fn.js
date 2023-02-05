import clipboardy from 'clipboardy'
import dayjs from 'dayjs'
import path from 'path'
import r from 'robotjs'
import fs from 'fs'
import Jimp from "jimp"
import { iconDb } from './db.js'
import axios from 'axios'


const DOMAIN   = `https://front.dev.suosihulian.com/`
const API_SAVE = `${DOMAIN}gateway/spider/api/spider/addIncrement`

const ITEM_LEN = 15
const ITEM_H   = 64
const SIZE     = 25
const NEWS_H   = 80
const DELAY    = 500
// const DIM      = { X:1920,Y:1080 }
const DIM      = { X:1680,Y:998 }
const p_search = { x:100, y:40  }  // 搜索框坐标
const p_item   = { x:100, y:115 }  // 搜索第一个元素坐标
const p_pre    = { x:500, y:60  }  // 滚动条底部坐标
const p_next   = { x:500, y:954 }  // 滚动条底部坐标
const p_copy   = { x:1270,y:670 }  // 拷贝按钮的坐标
const p_news   = { x:1000,y:330 }  // 第一个公众号新闻坐标
const p_icon   = { x:266, y:72  }  // 第一个公众号图标坐标




// 延时函数
export const delay = ms => new Promise(r => setTimeout(r, ms))
// 格式化时间
export const formatTime =(t)=> dayjs(t).format('YYYY-MM-DD hh:mm:ss')

// 移动并点击鼠标
export const moveClick =async(p,d=1000)=>{
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
  r.moveMouse(p_search.x,p_search.y)
  r.mouseClick()
  r.typeString('dyh')
  r.keyTap('enter')
  await delay(1000)
  r.moveMouseSmooth(p_item.x,p_item.y)
  r.mouseClick()
}


// 检查是否阅读过
export const checkUnread = (p,pos) => {
  let c1 = getPixelColor(p.x, p.y)
  let c2 = getPixelColor(p.x - 1, p.y)
  let c3 = getPixelColor(p.x + 1, p.y)
  let c4 = getPixelColor(p.x, p.y - 1)
  let c5 = getPixelColor(p.x, p.y + 1)
  // console.log(c1,c2,c3,c4,c5)

  return (c1=== pos.CLR)? true:false

  // if ((c1 === uc) && (c2 === uc) && (c3 === uc) && (c4 === uc) && (c5 === uc)) {
  //   return true
  // } else {
  //   return false
  // }
}


// 去掉重复元素
export const noRepeat =(list)=>{
  return list.filter((item, i) =>  list.indexOf(item) == i)
}


export const saveNews = (name,type,urls) => {
  let  data = { 
    "columnName":name,
    "accountType":type,
    "urls":urls,  
  }
  const opt = { headers: { 'Content-Type': 'application/json' }}
  axios.post(API_SAVE, data, opt).then( r => {
    if (r.data.code !== 0 ) {
      console.log(r);
    }else{
      console.log(data)
    }
  })
}


// 阅读公众号新闻
export const readSaveUrl = async(p,pos,name)=>{
  await moveClick(p)
  await moveClick(p_news)

  let url
  let newsList = []
  for (let j = 0; j < 8; j++) {
    let np = {x:pos.p_news.x, y:pos.p_news.y + j * pos.NEWS_H}
    await moveClick(np)

    //打开文件
    await moveClick({x:pos.p_copy.x, y:pos.p_copy.y})
    let url = clipboardy.readSync();
    newsList.push(url)
  }
  newsList = noRepeat(newsList)

  saveNews(name, pos.TYPE, newsList)
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
  return (count/len > 0.9)?0:1
}

export const getName =(icon,index, pos)=>{
  let ret = 'NULL'
  let type = pos.TYPE
  let db = iconDb[type]
  let find = false
  for(let i=0;i<db.length;i++) {
    let _dir = process.cwd()
    let _id  = db[i].id.padStart(3,'0')
    let file = path.join(_dir, `icon/json/${type}/${_id}.json`) 
    let data = fs.readFileSync(file)
    let buf  = Buffer.from(JSON.parse(data).image)
    // let rc = Buffer.compare(icon.image, buf)
    let rc = compare(icon.image, buf)
    if (rc === 0) {
      ret = db[i].name
      find = true
      break;
    }
  }
  if (!find) {
    let { TX, TW, TH } = pos
    let _dir  = process.cwd()
    let _id = dayjs().format('YYYMMDDHHmmss')
    let _fileIcon = path.join(_dir, `err/${_id}icon.png`)
    let _fileText = path.join(_dir, `err/${_id}text.bmp`)
    let _fileJson = path.join(_dir, `err/${_id}data.json`)
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