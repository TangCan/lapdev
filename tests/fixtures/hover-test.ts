import React from 'react';

const greeting: string = 'Hello, World!';

/**
 * Returns a greeting message
 * @param name The name to greet
 * @returns The greeting string
 */
function HelloWorld(name: string): string {
  return `Hello, ${name}!`;
}

class User {
  name: string;
  age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
  
  greet(): string {
    return `Hello, I'm ${this.name}, ${this.age} years old`;
  }
}

interface Config<T extends string> {
  key: T;
  value: string;
}

const config: Config<'api'> = {
  key: 'api',
  value: 'http://localhost:3333'
};

export { greeting, HelloWorld, User, config };
