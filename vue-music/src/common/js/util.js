function getRandomInt(min, max) {
  //随机生成一个min-max的数  包含min 和 max
  return Math.floor(Math.random() * (max - min + 1) + min)
}
//洗牌函数
export function shuffle(arr) {
  let _arr = arr.slice()
  for (let i = 0; i < _arr.length; i++) {
    let j = getRandomInt(0, i)
    let t = _arr[i]
    _arr[i] = _arr[j]
    _arr[j] = t
  }
  return _arr
}

//节流函数  要延迟执行的函数  延迟执行的时间
export function debounce(func, delay) {
  let timer

  return function (...args) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}
