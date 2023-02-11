import dayjs from 'dayjs'
import schedule from 'node-schedule';

const delay = ms => new Promise(r => setTimeout(r, ms))

const task = async()=>{
  
  let h = dayjs().hour()
  let m = dayjs().minute()
  let s = dayjs().second()
  console.log(h,m,s)
  await delay(1000)
}

const TIME_START = 8
const TIME_END = 10

const rule = new schedule.RecurrenceRule();
rule.hour = TIME_START

const job = schedule.scheduleJob(rule, async ()=>{
  console.log(dayjs().format('HH:mm:ss'))

  while(1) {
    await task()    
    if (dayjs().hour() > TIME_END ) {
      console.log(dayjs().format('HH:mm:ss'))
      break
    }
  }
});

