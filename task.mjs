import clipboardy from 'clipboardy'
import dayjs from 'dayjs'
import path from 'path'
import r from 'robotjs'
import fs from 'fs'
import Jimp from "jimp"
import { iconDb,PS } from './db.js'
import { delay, moveClick, checkUnread, getPixelColor, noRepeat, saveData, readSaveUrl, calcTime, formatTime, checkEndByIcon, scrollToTop, getName, saveIcon, openRead } from './fn.js'


// 订阅号任务
const task = async(pos)=> {
  let fr = dayjs()
  let page = 1
  let sect = 0
  let news = 0
  let newsCount

  while(1) {
    
    for(let i=0;i<pos.ITEM_L;i++) {
      let p = {x:pos.p_init.x, y:pos.p_init.y+pos.ITEM_H*i}
      let c = checkUnread(p,pos)
      
      if (c) {
        await moveClick(p)
        let icon  = r.screen.capture(pos.p_icon.x, pos.p_icon.y+pos.ITEM_H*i, pos.SIZE, pos.SIZE);
        let name = getName(icon,i,pos)
        // console.log(name)
        if (name !== 'NULL') {
          newsCount = await readSaveUrl(p,pos,name)
        }
        await moveClick(p)
        sect++
        news += newsCount
      }
    }
    
    // 点击最后一个公众号
    let last = {x:pos.p_init.x, y:pos.p_init.y+pos.ITEM_H*(pos.ITEM_L-1)}
    await moveClick(last)
    let end = await checkEndByIcon(pos)
    if (end) break;
    page++
  }

  await scrollToTop(pos)

  let to = dayjs()
  let ret = {
    fr: formatTime(fr),
    to: formatTime(to),
    time: calcTime(fr,to),
    sect: sect,
    news: news,
  }
  await saveData(ret)
}


const main = async()=> {
  while(1) {
    await openRead()
    await task(PS.d)
    await task(PS.f)
    await delay(1000 * 60 * 5)
  }
}

main()




