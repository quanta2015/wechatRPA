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
const API_RPA  = `https://mqcai.top/rpa`
const API_KEY  = `085c073f-48d4-45ef-aca6-a68db926b60c`
const API_WARN = `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${API_KEY}`
const API_HIS_LIST = `${DOMAIN}gateway/spider/api/spider/getHistoryTaskList`


const DIM      = { X:1680,Y:998 }
const p_search = { x:100, y:40  }   // 搜索框坐标
const p_item   = { x:100, y:115 }   // 搜索第一个元素坐标
const p_init   = { x:950,  y:70  }  // 搜索第一新闻坐标
const p_next   = { x:1678, y:955 }  // 滚动轴坐标
const p_close  = { x:1664, y:646 }  // 关闭按钮的坐标
const p_copy   = { x:1268, y:675 }  // 拷贝按钮的坐标
const p_sub    = { x:800, y:235 }   // 搜索结果坐标
const p_fr     = 735                // 关注按钮横坐标
const NEWS_H   = 80
const NEWS_SUM = 12



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
export const openRead = async(str) => {
  moveClick(p_search)
  r.typeString(str)
  r.keyTap('enter')
  await delay(1000)
  moveClick(p_item)
  await delay(3000)
}

// 搜索打开对象
export const openTarget = async(item)=>{
  moveClick(p_search)
  clipboardy.writeSync(item);
  r.keyTap('v', ['control']);
  await delay(1000)
  r.keyTap('enter')
  await delay(1500)
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


export const warning =(data)=>{
  let content = `公众号数据入库失败，请检查！\n${JSON.stringify(data)}`
  let params = {
    "msgtype": "text",
    "text": {
      "content":content.replace(/(?:\\[rn])+/g, ""),
      "mentioned_list":["@all"],
      "mentioned_mobile_list":["@all"]
    }
  }
  const opt = { headers: { 'Content-Type': 'application/json' }}
  axios.post(API_WARN, params, opt)
}

export const saveNews = async(name,type,urls) => {
  let  data = { 
    "columnName":name,
    "accountType":type?0:1,
    "urls":urls,  
  }
  const opt = { headers: { 'Content-Type': 'application/json' }}

  let s = await axios.post(API_SAVE, data, opt)
  if (s.data.code !== 0 ) {
    warning(data)
  }
}



export const paste =()=>{
  execSync('powershell get-clipboard > clip')
  let data = readFileSync( 'clip' ,{encoding:'utf8'})
  return data
}


// 阅读历史公众号新闻
export const readCopyUrl =async(list)=>{
  for (let j = 0; j < NEWS_SUM; j++) {
    let np = {x:p_init.x, y:p_init.y + j * NEWS_H}
    await moveClick(np,2000)
    await moveClick({x:p_copy.x, y:p_copy.y},1000)
    await moveClick(p_close,100)
    let url = paste()
    list.push(url)
    await delay(500)
  }
  list = noRepeat(list)
}


// 阅读公众号新闻
export const readSaveUrl = async(p,pos,name)=>{
  await moveClick(p)
  await moveClick(pos.p_news)

  let url
  let newsList = []
  for (let j = 0; j < 8; j++) {
    let np = {x:pos.p_news.x, y:pos.p_news.y + j * pos.NEWS_H}
    await moveClick(np,1000)

    //打开文件
    await moveClick({x:pos.p_copy.x, y:pos.p_copy.y},2000)
    // let url = clipboardy.readSync();
    let url = paste()
    newsList.push(url)
    await delay(2000)
  }
  newsList = noRepeat(newsList)

  saveNews(name, pos.TYPE, newsList)
  // saveRpa(name, pos.TYPE, newsList)
  return newsList.length
}


// 滚动到顶部
export const scrollToTop =async (pos,pageSize=60)=> {
  for (let i = 1; i<pos.PAGE_SIZE; i++ ) {
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
  return (count/len > 0.8)?0:1
}


const getByFilename =(list,name)=>{
  // console.log(name)
  let index = -1
  for(let i=0;i<list.length;i++) {
    if (name === list[i].id) {
      index = i
    }
  }
  return index>0?list[index].name:'NULL'
}


const saveName =(file,name)=>{
  fs.appendFileSync('db.json', `${file} ${name}\n`);
}

export const findIcon =(icon,dir,db,err)=>{
  let ret = 'NULL'
  let find = false
  let _root = process.cwd()
  const files = fs.readdirSync(dir)

  for(let i=0;i<files.length;i++) {
    let fileName = `${dir}${files[i]}`;
    let stat = fs.lstatSync(fileName);
    if (stat.isFile() === true) { 
      let data = fs.readFileSync(fileName)
      let buf  = Buffer.from(JSON.parse(data).image)
      let rc = compare(icon.image, buf)

      
      if (rc === 0) {
        // ret = err?0:db[i].name
        let name = files[i].split('.')[0]
        ret = err?0:getByFilename(db,name)
        // saveName(files[i],ret)
        find = true
        break;
      }
    }
  }
  return {ret, find}
}

export const getName =(icon,index, pos)=>{
  let type = pos.TYPE
  let db = iconDb[type]
  let _root = process.cwd()
  let _dir = path.join(_root, `icon/json/${type}/`)
  let {ret, find} = findIcon(icon,_dir,db,false)

  let _dirErr = path.join(_root, `err/json/${type}/`)
  let findErr = findIcon(icon,_dirErr,db,true)

  if ((!find)&&(!findErr.find)) {
    console.log('save err icon')
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
  console.log(data)
}

// 根据图标判断是否到底部
export const checkEndByScroll =async(pos)=>{
  let clr_p = getPixelColor(pos.p_next.x, pos.p_next.y)
  // 点击滚动条到下一页
  await moveClick(pos.p_next)
  let clr_c = getPixelColor(pos.p_next.x, pos.p_next.y)
  await moveClick({ x:pos.p_next.x+10, y:pos.p_next.y })
  console.log(clr_p,clr_c)

  // 非last one选中
  let cond1 = (clr_p==='f5f5f5')&&(clr_c==='bababa') 
  // last one 选中
  let cond2 = (clr_p==='d4d4d4')&&(clr_c==='a1a1a1')
  return (cond1||cond2)?true:false
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


export const getHisList = async(name,type,urls) => {
  const opt = { headers: { 'Content-Type': 'application/json' }}
  let r = await axios.get(API_HIS_LIST)
  if (r.data.code === 0) {
    return r.data.data
  }else{
    console.log("获取历史数据出错")
  }
}

export const filterDb =(list)=>{

  let same = 0
  let len = list.length

  for(let i=0;i<len;i++) {

    for(let j=i+1;j<len;) {
      if (list[i].name === list[j].name) {
        // console.log(list[i].id, list[j].id)
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