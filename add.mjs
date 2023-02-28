import r from 'robotjs'
import clipboardy  from 'clipboardy'
import { iconDb,PS } from './db.js'
import { db } from './data.js'
import { 
  delay, 
  moveClick,
  getHisList
} from './fn.js'


const p_search = { x:100, y:40  }  // 搜索框坐标
const p_sub    = { x:800, y:235 }  // 搜索结果坐标
const p_fr     = 735               // 关注按钮横坐标


// 添加订阅号任务
export const subscribe = async(pos)=> {
  let list = await getHisList()

  for(let i=0;i<list.length;i++) {
    moveClick(p_search)
    clipboardy.writeSync(list[i]);
    r.keyTap('v', ['control']);
    await delay(1000)
    r.keyTap('enter')
    await delay(2000)

    moveClick(p_item)
    await delay(3000)
    moveClick(p_item)
    await delay(3000)
    moveClick({x:p_fr,y:305},100)
    moveClick({x:p_fr,y:325},100)
    moveClick({x:p_fr,y:345},100)
    moveClick({x:p_fr,y:365},100)
    moveClick({x:p_fr,y:385},100)
    await delay(2000)
  }
}




subscribe()







