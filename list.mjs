// 保存订阅号列表
import dayjs from 'dayjs'
import path from 'path'
import r from 'robotjs'
import fs from 'fs'
import Jimp from "jimp"
import { iconDb,PS } from './db.js'
import { 
  delay, 
  warning,
  getName,
  saveIcon,
  calcTime, 
  openRead,
  noRepeat, 
  saveData, 
  filterDb,
  moveClick,
  formatTime, 
  scrollToTop,
  readSaveUrl,
  checkUnread, 
  getPixelColor, 
} from './fn.js'


// 订阅号任务
const task = async(pos)=> {
  let page = 1
  let cache = []

  while(1) {
    
    for(let i=0;i<pos.ITEM_L;i++) {
      let p = {x:pos.p_init.x, y:pos.p_init.y+pos.ITEM_H*i}
      await moveClick(p)
      let icon  = r.screen.capture(pos.p_icon.x, pos.p_icon.y+pos.ITEM_H*i, pos.SIZE, pos.SIZE);
      cache.push(getName(icon,i,pos))
    }
    
    // 点击滚动条到下一页
    await moveClick(pos.p_next)
    page++
    if (page>pos.PAGE_SIZE) break;

    await delay(1000)
  }

  await scrollToTop(pos,pos.PAGE_SIZE)


  let _dir = process.cwd()
  let _file = path.join(_dir, `list.json`)
  fs.writeFileSync(_file,JSON.stringify(cache, null, 2))
  console.log(cache)
}


task(PS.d)


// filterDb(iconDb[0])

