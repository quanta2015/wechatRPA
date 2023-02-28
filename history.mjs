// 获取历史文章
import dayjs from 'dayjs'
import path from 'path'
import r from 'robotjs'
import fs from 'fs'
import Jimp from "jimp"
import { iconDb,PS } from './db.js'
import { 
  delay, 
  paste,
  noRepeat, 
  saveNews,
  getHisList,
  moveClick,
  openTarget,
  readCopyUrl,
} from './fn.js'
import clipboardy  from 'clipboardy'



const p_search = { x:100,  y:40  }  // 搜索框坐标
const p_init   = { x:950,  y:70  }  // 搜索第一新闻坐标
const p_next   = { x:1678, y:955 }  // 滚动轴坐标
const p_close  = { x:1664, y:646 }  // 关闭按钮的坐标
const p_copy   = { x:1268, y:675 }  // 拷贝按钮的坐标
const NEWS_H   = 80
const NEWS_SUM = 12


// 订阅号任务
export const history = async(pos)=> {
  let list = await getHisList()

  console.log(list)

  for(let i=0;i<list.length;i++) {
    let newsList = []

    await openTarget(list[i].columnName)
    while(newsList.length<30) {
      await readCopyUrl(newsList)
      await moveClick(p_close,1000)
      await moveClick(p_next,2000)
    }
    saveNews(list[i].columnName,list[i].accountType,newsList)
  }
}


history()





