global.die = function (...args) {
  if (args.length > 1) {
    console.error(args.join(','));
  } else {
    console.error(args[0]);
  }
  process.exit(1);
};
