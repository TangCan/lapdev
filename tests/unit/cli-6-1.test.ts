const red = (name: string, fn: () => void) => Deno.test({ name, ignore: true }, fn);

red('AC-1: versioned CLI exposes web, doctor and version', () => {
  throw new Error('RED: implement the versioned CLI command contract');
});

red('AC-2: web --no-open starts localhost runtime without project toolchains', () => {
  throw new Error('RED: implement local runtime startup');
});

red('AC-3: invalid runtime is rejected before launch', () => {
  throw new Error('RED: implement runtime validation and stable errors');
});

red('AC-4: doctor reports safe environment checks', () => {
  throw new Error('RED: implement doctor diagnostics');
});

red('AC-5: invalid invocation has stable non-zero exit without untrusted I/O', () => {
  throw new Error('RED: implement CLI input and path safety');
});

red('AC-6: source-install entrypoints remain compatible', () => {
  throw new Error('RED: preserve source-install commands');
});
