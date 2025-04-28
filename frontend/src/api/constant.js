// // Language versions
// export const LANGUAGE_VERSIONS = {
// 	cpp: 'GCC 11.1.0',
// 	c: 'GCC 11.1.0',
// 	python: 'Python 3.10.0',
// 	javascript: 'Node.js 16.13.0',
// 	java: 'JDK 17.0.1',
// };

// // Default code snippets for each language
// export const CODE_SNIPPETS = {
// 	cpp: `#include <iostream>
// using namespace std;

// int main() {
//     cout << "Hello, World!";
//     return 0;
// }`,
// 	c: `#include <stdio.h>

// int main() {
//     printf("Hello, World!");
//     return 0;
// }`,
// 	python: `print("Hello, World!")`,
// 	javascript: `console.log("Hello, World!");`,
// 	java: `public class Main {
//     public static void main(String[] args) {
//         System.out.println("Hello, World!");
//     }
// }`,
// };

export const LANGUAGE_VERSIONS = {
	cpp: '10.2.0',
	c: '10.2.0',
	javascript: '18.15.0',
	java: '15.0.2',
	python: '3.10.0',
};

export const CODE_SNIPPETS = {
	cpp: `#include <iostream>\nusing namespace std;\nint main() {\n\tcout << "Hello, World!";\n\treturn 0;\n}`,

	c: `#include <stdio.h>\nint main() {\n\tprintf("Hello, World!");\n\treturn 0;\n}`,

	javascript: `console.log("Hello, World!");`,

	java: `class Main {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello, World!");\n\t}\n}`,

	python: `print("Hello, World!")`,
};
