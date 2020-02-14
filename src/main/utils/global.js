global.die = function (...args) {
  console.error(args)
  process.exit(1)
}
