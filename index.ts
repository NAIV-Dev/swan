import { parse } from '@naiv/swan-dsl';
import { SWANServer } from './SWANServer';

// async function main() {
//   const swan_sample = `
// app MyApp {
//   entry Home
// }

// page Home {
//   header "Welcome"
//   button "Log in" -> Login
// }

// component LoginForm {
//   field email
//   field password

//   submit "Continue" -> auth

//   on auth {
//     success -> Dashboard
//     error -> LoginError
//   }
// }

// page Login {
//   header "Login"
//   use LoginForm
// }

// page LoginError {
//   text "Invalid credentials"
//   button "Retry" -> Login
// }

// page Dashboard {
//   header "Dashboard"
//   text "Hello!"
//   button "Logout" -> Home
// }
// `;
//   const res = parse(swan_sample);
//   new SWANServer().run({
//     swan_result: res
//   });
// }

// main().then(console.log).catch(console.error);
