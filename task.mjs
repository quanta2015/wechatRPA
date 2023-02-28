import dayjs from 'dayjs'
import path from 'path'
import r from 'robotjs'
import fs from 'fs'
import Jimp from "jimp"
import { iconDb,PS } from './db.js'
import { 
  delay, 
  getName,
  openRead,
  moveClick, 
  scrollToTop,
  readSaveUrl, 
  checkUnread, 
  openTarget,
  readCopyUrl,
} from './fn.js'
import { history } from './history.mjs'
import { subscribe } from './add.mjs'


// 增量=false 全量=true
let full = false
let TIME_FR = 7
let TIME_TO = 23


const task = async(pos)=> {
  let page = 1
  let sect = 0
  let news = 0
  let newsCount
  let cache = new Set()

  while(1) {
    for(let i=0;i<pos.ITEM_L;i++) {
      let p = {x:pos.p_init.x, y:pos.p_init.y+pos.ITEM_H*i}
      let c = full?true:checkUnread(p,pos)
      
      if (c) {
        await moveClick(p,3000)
        let icon  = r.screen.capture(pos.p_icon.x, pos.p_icon.y+pos.ITEM_H*i, pos.SIZE, pos.SIZE);
        let name = getName(icon,i,pos)

        // not exist in cache
        if (!cache.has(name)) {
          console.log(name)
          if (name !== 'NULL') {
            newsCount = await readSaveUrl(p,pos,name)
          }
          await moveClick(p)
          sect++
          news += newsCount
          cache.add(name)
        }
      }
    }

    // 点击滚动条到下一页
    await moveClick(pos.p_next)
    page++
    if (page>pos.PAGE_SIZE) break;

    await delay(1000 * 5)
  }

  await scrollToTop(pos,pos.PAGE_SIZE)
  console.log({ sect, news, cache })
  return news
}



const main = async()=> {
  let turn = 1
  while(1) {
    let h = dayjs().hour()
    let c1 = -1
    let c2 = -1
    
    if ((h>= TIME_FR)&&(h<TIME_TO)) {
      // await subscribe()
      // console.log(`第 ${turn} 轮 关注公众号 finished...`)

      // await history()
      // console.log(`第 ${turn} 轮 历史订阅号 finished...`)

      await openRead(PS.d.NAME)
      c1 = await task(PS.d)
      console.log(`第 ${turn} 轮 订阅号 finished...`)

      await openRead(PS.f.NAME)
      c2 = await task(PS.f)
      console.log(`第 ${turn} 轮 服务号 finished...`)
      turn++

      if (c1+c2===0) {
        console.log('wait 5 minutes')
        await delay(1000 * 60 * 5)
      }else {
        console.log('wait 1 minutes')
        await delay(1000 * 60)
      }
    }else{
      console.log('sleeping ...')
      await delay(1000 * 60)
      turn = 0
    }
  }
}

main()

