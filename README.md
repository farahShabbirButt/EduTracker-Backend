Commands after writing migrations 
npx prisma format
npx prisma migrate dev --name fix_relations_after_subjectclass
npx prisma generate
npx prisma studio

Setup for seeds 
---> add a seed.ts file and seeds data in it then in package.json add this below line
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
--> Then run this below command if ts-node not already installed
npm install -D ts-node

RUN SEED
npx prisma db seed
