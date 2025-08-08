declare module '*.module.scss' {
  const classes: { [className: string]: string };
  export default classes;
}

declare module '*.scss' {
  const content: string;
  export default content;
}


