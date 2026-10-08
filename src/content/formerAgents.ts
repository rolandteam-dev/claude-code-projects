/**
 * Former teammates — agents who have LEFT the team (deactivated in Slack). The
 * Referral Watch flags a closing in our database where the listing agent is one
 * of these, so we can decide whether a referral is due.
 *
 * ⚠️ PARTIAL LIST: seeded from the Slack "Manage members" roster, Deactivated
 * only, names A–L (the M–Z rows had scrolled off). ADD the rest — the match is
 * by first + last name, so exact middle initials/suffixes don't matter.
 * Current (Active) members are intentionally excluded so they never trigger.
 *
 * To update: just add/remove names here (one per line) and redeploy.
 */
export const formerAgents: string[] = [
  "Aaron Mazza",
  "Adam J Flores",
  "Alan Spano",
  "Amber Holliday",
  "Amber Mabry",
  "Andrea Stone",
  "Andres Jensen",
  "Anna Sirenko-Michaeli",
  "Annie Verruno",
  "Antonija Markotic",
  "Arturo Romero",
  "Ashley Hickman",
  "Becca Stoker",
  "Betty Carvajal",
  "Bradlee Evans",
  "Brandi Slade",
  "Brandon Keesee",
  "Brandon Mindaros",
  "Brett Smith",
  "C.C. McCandless",
  "Calvin Taumua",
  "Camille Johns",
  "Cassidy Torres",
  "Charmaine Kryszczuk",
  "Crystal Sanchez",
  "Dan French",
  "Darren Wu",
  "Deniece Glacee",
  "Diane Worden",
  "Dylan Walling",
  "Ellis Gonzalez",
  "Gabriel Santana",
  "Gage Fleming",
  "Gina Perry",
  "Glendy Garcia",
  "Itzel Tesfaye",
  "Ivrianna Bernal",
  "Jahshua Brown Waduud",
  "James Clark",
  "Jamie Dunn",
  "Jan Lambert Munoz",
  "Jane Marroquin",
  "Janelle Pittman",
  "Jarvis Jay Luzadas",
  "Jason Leary",
  "Jason Schifrin",
  "Jayce Weinmann",
  "Jennica Lindqvist",
  "Jesse Stone",
  "Joel Adams",
  "Josh Connery",
  "Justin Willmon",
  "Katalin Laczkovics",
  "Kelly Dooling",
  "Kendra Steinberger",
  "Kenia Pardo-Moscoso",
  "Lilia Bright",
  "Lindsay L. Timm",
  "Logan Ostrea",
  "Lucy Bouza",
  // --- ADD M–Z HERE ---
];
