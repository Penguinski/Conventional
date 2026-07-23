import { expect, test, type Locator, type Page } from "@playwright/test";
import { dots } from "../../src/games/connect-dots/logic";
import { dailyWord } from "../../src/games/five-letters/logic";
import { solutionCells } from "../../src/games/crossword/logic";

async function pointerErrors(page:Page){
  const errors:string[]=[];
  page.on("pageerror",(error)=>errors.push(error.message));
  page.on("console",(message)=>{if(message.type()==="error")errors.push(message.text());});
  return errors;
}

async function mouseStroke(page:Page,canvas:Locator,points:Array<[number,number]>){
  const box=await canvas.boundingBox();
  if(!box)throw new Error("Canvas unavailable");
  const screen=points.map(([x,y])=>({x:box.x+x*box.width,y:box.y+y*box.height}));
  await page.mouse.move(screen[0].x,screen[0].y);
  await page.mouse.down();
  for(const [index,point] of screen.slice(1).entries()){
    await page.mouse.move(point.x,point.y,{steps:3});
    await page.waitForTimeout(20);
    if(index===0){
      await expect(page.locator("#root")).toBeVisible();
      await expect(page.locator(".game-overlay")).toBeVisible();
      await expect(canvas).toBeVisible();
    }
  }
  await page.mouse.up();
}

async function touchStroke(page:Page,canvas:Locator,points:Array<[number,number]>){
  const box=await canvas.boundingBox();
  if(!box)throw new Error("Canvas unavailable");
  const screen=points.map(([x,y])=>({x:box.x+x*box.width,y:box.y+y*box.height}));
  const session=await page.context().newCDPSession(page);
  await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...screen[0],id:1,radiusX:5,radiusY:5,force:.7}]});
  for(const [index,point] of screen.slice(1).entries()){
    await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{...point,id:1,radiusX:5,radiusY:5,force:.7}]});
    await page.waitForTimeout(20);
    if(index===0){
      await expect(page.locator("#root")).toBeVisible();
      await expect(page.locator(".game-overlay")).toBeVisible();
      await expect(canvas).toBeVisible();
    }
  }
  await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  await session.detach();
}

async function expectCurrentGameCompleted(page:Page){
  await expect(page.locator(".game-tools").getByText("COMPLETATO",{exact:true})).toBeVisible();
}

test("home uses the intended grid, complete tabs, and no hamburger",async({page},testInfo)=>{
  await page.goto("/");
  await expect(page.locator(".issue-card")).toHaveCount(17);
  await expect(page.getByRole("button",{name:"Apri indice"})).toHaveCount(0);
  const columns=await page.locator(".card-grid").evaluate((node)=>getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBe(testInfo.project.name==="desktop"?4:2);
  const tabs=page.locator(".corner-tab");
  await expect(tabs).toHaveCount(17);
  for(const tab of await tabs.all()){
    const label=tab.locator("b");
    await expect(label).toBeVisible();
    expect((await label.boundingBox())?.width).toBeGreaterThan(20);
  }
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test("captures the final responsive reference",async({page},testInfo)=>{
  await page.goto("/");
  await expect(page.locator(".issue-card")).toHaveCount(17);
  await page.screenshot({path:`docs/qa-repair/home-${testInfo.project.name}.png`,fullPage:true});
});

test("shared URL, browser back, and scroll restoration work",async({page})=>{
  await page.goto("/");
  const visibleCard=page.locator(".issue-card").nth(7);
  await visibleCard.scrollIntoViewIfNeeded();
  const before=await page.evaluate(()=>window.scrollY);
  await visibleCard.click();
  await expect(page.locator(".game-sheet")).toBeVisible();
  await page.getByRole("button",{name:"Torna alla rivista"}).click();
  await expect(page.locator(".card-grid")).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThanOrEqual(before-2);
  await page.goto("/?gioco=intruso");
  await expect(page.getByRole("heading",{name:"Trova l’intruso"})).toBeVisible();
});

test("mouse pointer completes maze and dust without blank screens",async({page},testInfo)=>{
  test.skip(testInfo.project.name!=="desktop");
  const errors=await pointerErrors(page);
  await page.goto("/?gioco=fuori-traccia");
  const maze=page.getByTestId("maze-canvas");
  await mouseStroke(page,maze,[[.067,.055],[.25,.24],[.5,.5],[.75,.74],[.933,.945]]);
  await expect(page.getByText(/Percorso (scorciatoia|ibrido|ufficiale)/)).toBeVisible();
  await expect(page.locator("#root")).toBeVisible();
  await page.getByRole("button",{name:"Torna alla rivista"}).click();

  await page.goto("/?gioco=polvere");
  const dust=page.getByTestId("dust-canvas");
  await mouseStroke(page,dust,[[.22,.25],[.32,.35],[.45,.46],[.58,.55],[.72,.65]]);
  await page.getByRole("button",{name:"FINITO"}).click();
  await expect(page.getByText("Segno conservato")).toBeVisible();
  const download=page.waitForEvent("download");
  await page.getByRole("button",{name:"ESPORTA PNG"}).click();
  expect((await download).suggestedFilename()).toBe("conventional-segno.png");
  await page.getByRole("button",{name:"RICOMINCIA"}).click();
  await expect(page.getByText("Polvere ripristinata.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("touch pointer completes both canvases and survives cancel/lost capture",async({page},testInfo)=>{
  test.skip(testInfo.project.name!=="mobile-390");
  const errors=await pointerErrors(page);
  await page.goto("/?gioco=fuori-traccia");
  const maze=page.getByTestId("maze-canvas");
  await touchStroke(page,maze,[[.067,.055],[.25,.25],[.5,.5],[.74,.74],[.933,.945]]);
  await expect(page.locator(".result-panel")).toBeVisible();
  await maze.dispatchEvent("pointerdown",{pointerId:77,pointerType:"touch",clientX:10,clientY:10,bubbles:true});
  await maze.dispatchEvent("pointercancel",{pointerId:77,pointerType:"touch",clientX:20,clientY:20,bubbles:true});
  await maze.dispatchEvent("lostpointercapture",{pointerId:77,pointerType:"touch",bubbles:true});
  await expect(page.locator("#root")).toBeVisible();

  await page.goto("/?gioco=polvere");
  const dust=page.getByTestId("dust-canvas");
  await touchStroke(page,dust,[[.2,.25],[.35,.35],[.5,.48],[.65,.6]]);
  await page.getByRole("button",{name:"FINITO"}).click();
  await expect(page.getByText("Segno conservato")).toBeVisible();
  expect(errors).toEqual([]);
});

test("one real complete flow for all twelve games persists 12/12",async({page},testInfo)=>{
  test.setTimeout(90_000);
  test.skip(testInfo.project.name!=="desktop");
  await page.goto("/?gioco=fuori-traccia");
  await mouseStroke(page,page.getByTestId("maze-canvas"),[[.067,.055],[.3,.3],[.6,.62],[.933,.945]]);
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=intruso");
  await page.getByRole("button",{name:"Figura 10"}).click();
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=cassetto");
  const targetText=(await page.locator(".game-status").innerText()).match(/CERCA:\s*([A-Z]+)/)?.[1]?.toLowerCase();
  if(!targetText)throw new Error("Drawer target missing");
  const drawer=page.locator(".drawer");
  const drawerBox=await drawer.boundingBox();
  const targetObject=page.getByRole("button",{name:targetText,exact:true});
  const targetBox=await targetObject.boundingBox();
  if(!drawerBox||!targetBox)throw new Error("Drawer geometry missing");
  const destination={
    x:targetBox.x+targetBox.width/2<drawerBox.x+drawerBox.width/2?drawerBox.width-40:40,
    y:targetBox.y+targetBox.height/2<drawerBox.y+drawerBox.height/2?drawerBox.height-40:40,
  };
  const objects=page.locator(".drawer-object");
  for(const object of await objects.all()){
    if((await object.getAttribute("aria-label"))===targetText)continue;
    const box=await object.boundingBox();
    if(box)await object.dragTo(drawer,{targetPosition:destination});
  }
  await targetObject.click();
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=collega-punti");
  await mouseStroke(page,page.locator(".dots-board"),dots.map(([x,y]):[number,number]=>[x/100,y/100]));
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=polvere");
  await mouseStroke(page,page.getByTestId("dust-canvas"),[[.25,.3],[.4,.4],[.55,.55]]);
  await page.getByRole("button",{name:"FINITO"}).click();
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=prima-dopo");
  await page.getByRole("button",{name:"DOPO",exact:true}).click();
  const targets=page.locator('svg[aria-label="Stanza dopo"] .difference-target');
  for(const target of await targets.all())await target.click({force:true});
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=caso-piatti");
  await page.getByRole("button",{name:"Ispeziona Padella"}).click();
  await page.getByRole("button",{name:"Ispeziona Tazza verde"}).click();
  await page.getByRole("button",{name:"ACCUSA MARTA"}).click();
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=cinque-tracce");
  await expect(page.locator(".word-board")).toBeVisible();
  await page.keyboard.type(dailyWord());
  await page.keyboard.press("Enter");
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=cruciverba");
  for(const [key,letter] of solutionCells()){
    const [row,col]=key.split("-").map(Number);
    await page.getByLabel(`Casella ${row+1}, ${col+1}`).fill(letter);
  }
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=scontrino");
  for(let answer=0;answer<6;answer+=1)await page.locator(".quiz-question button").filter({hasNotText:"DOMANDA PRECEDENTE"}).first().click();
  await page.getByRole("button",{name:"CONFERMA RISULTATO"}).click();
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=fondo-tazza");
  await page.getByRole("button",{name:"MODALITÀ DEMO"}).click();
  await page.getByRole("button",{name:"ANELLO"}).click();
  await expectCurrentGameCompleted(page);

  await page.goto("/?gioco=piede");
  await page.getByRole("button",{name:"MODALITÀ DEMO"}).click();
  await page.getByRole("button",{name:"PUNTA"}).click();
  await page.getByRole("button",{name:"CONFERMA MAPPA D'USURA"}).click();
  await expectCurrentGameCompleted(page);

  await page.goto("/");
  await expect(page.locator(".issue-counter")).toHaveText("12/12");
  await page.reload();
  await expect(page.locator(".issue-counter")).toHaveText("12/12");
});
