import clipboardy from 'clipboardy'
import dayjs from 'dayjs'
import path from 'path'
import r from 'robotjs'
import fs from 'fs'
import Jimp from "jimp"
import {PS,iconDb} from './db.js'
import { 
  getPixelColor,
  moveClick,
  saveIcon,
} from './fn.js'

const _dir  = process.cwd()



// 公众号图标生成
const task = async(pos)=> {
  let page = 1

  while(1) {
    for(let i=0;i<pos.ITEM_L;i++) {
      let p = {x:pos.p_init.x, y:pos.p_init.y+pos.ITEM_H*i}
      await moveClick(p,3000)

      let _id   = (i+1+pos.ITEM_L*(page-1)).toString().padStart(4,'0')
      let _fileIcon = path.join(_dir, `data/img/${_id}icon.png`)
      let _fileText = path.join(_dir, `data/text/${_id}text.bmp`)
      let _fileJson = path.join(_dir, `data/json/${_id}data.json`)
      
      let icon  = r.screen.capture(pos.p_icon.x, pos.p_icon.y+pos.ITEM_H*i, pos.SIZE, pos.SIZE);
      let text  = r.screen.capture(pos.p_icon.x+pos.TX, pos.p_icon.y+pos.ITEM_H*i, pos.TW, pos.TH);
      saveIcon(icon,_fileIcon)
      saveIcon(text,_fileText)
      fs.writeFileSync(_fileJson,JSON.stringify(icon, null, 2))
    }

    
    await moveClick(pos.p_next)
    page++
    if (page>pos.PAGE_SIZE) break;
  }

}

task(PS.d)

