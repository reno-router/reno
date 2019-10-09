const parsePath = (path: string) =>
  new RegExp(
    path.split('/')
      .map(part => part === '*' ? '.*' : part)
      .join('/')
  );

export default parsePath;
