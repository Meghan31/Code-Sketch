// Language versions
export const LANGUAGE_VERSIONS = {
	cpp: 'GCC 11.1.0',
	c: 'GCC 11.1.0',
	python: 'Python 3.10.0',
	javascript: 'Node.js 16.13.0',
	java: 'JDK 17.0.1',
};

// Default code snippets for each language
export const CODE_SNIPPETS = {
	cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!";
    return 0;
}`,
	c: `#include <stdio.h>

int main() {
    printf("Hello, World!");
    return 0;
}`,
	python: `print("Hello, World!")`,
	javascript: `console.log("Hello, World!");`,
	java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
};
