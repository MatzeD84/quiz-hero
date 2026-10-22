import { openDialog, closeDialog } from './dialog.js?v=dev';
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
function artwork(item,cls){
    let url;try{url=new URL(item.image,location.href);}catch{return null;}
    if(url.origin!==location.origin||!url.pathname.startsWith('/images/'))return null;
    const img=el('img',cls);img.src=url.href;img.alt='';img.width=256;img.height=256;img.loading='lazy';img.addEventListener('error',()=>img.remove(),{once:true});return img;
}
function detail(item,playable){
    const d=el('dialog','modal souvenir__dialog');d.id='souvenir-detail';d.setAttribute('aria-label',item.title);const c=el('div','modal__content');
    const close=el('button','modal__close-button icon-button');close.type='button';close.setAttribute('aria-label','Schließen');
    close.innerHTML='<svg class="icon-button__icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 5 6 6 6-6 1 1-6 6 6 6-1 1-6-6-6 6-1-1 6-6-6-6z"/></svg>';
    const wrap=el('div','modal__close');wrap.append(close);close.addEventListener('click',()=>closeDialog(d));
    c.append(wrap,el('h2','modal__headline',item.title));const img=artwork(item,'souvenir__detail-image');if(img)c.append(img);
    c.append(el('p','',item.description),el('p','souvenir__muted',item.rule==='first_visit'?'Eine Kategorienrunde mit mindestens einer beantworteten Frage beendet.':`${item.target} unterschiedliche Fragen richtig beantwortet und die Kategorie besucht.`),el('p','souvenir__muted',`${item.backfilled?'Aus bisherigen Reisen ergänzt am':'Erhalten am'} ${new Date(item.awardedAt).toLocaleDateString('de-DE')}`));
    if(playable && item.rule!=='first_visit'){const a=el('a','passport__link','Kategorie spielen');a.href=`index.html?${new URLSearchParams({category:item.categoryId})}`;c.append(a);}
    d.append(c);document.body.append(d);d.addEventListener('click',e=>{if(e.target===d)closeDialog(d);});d.addEventListener('close',()=>d.remove(),{once:true});openDialog(d);
}
export function souvenirItems(collection={},category='',rule=''){
    const matches=item=>(!category||item.categoryId===category)&&(!rule||item.rule===rule);
    return {
        earned:[...(collection.earned||[])].filter(matches).sort((a,b)=>(Date.parse(b.awardedAt)||0)-(Date.parse(a.awardedAt)||0)),
        goals:(collection.goals||[]).filter(matches)
    };
}
export function startedSouvenirs(collection={}){
    return (collection.goals||[]).filter(item=>item.rule==='discover'&&item.current>0);
}
export function renderSouvenirs(collection={},selections=[],{preview=false,full=false}={}){
    const section=el('section','souvenir');section.id='souvenirs';section.append(el('h2','passport__heading','Deine Souvenirs'),el('p','passport__muted','Kleine Erinnerungen an große Entdeckungen. Sammle ein Stück deiner Quizreisen.'));
    const items=souvenirItems(collection),earned=preview?items.earned.slice(0,3):items.earned,goals=preview?[]:startedSouvenirs(items);const grid=el('div','souvenir__grid');const canPlay=id=>selections.some(s=>s.kind==='category'&&s.id===id&&s.available);
    for(const item of earned){
        const card=el('article','souvenir__card');const img=artwork(item,'souvenir__image');if(img)card.append(img);const body=el('div','souvenir__body');body.append(el('p','souvenir__eyebrow',item.rule==='first_visit'?'REISESTEMPEL':'ENTDECKER-SOUVENIR'),el('h3','passport__station-title',item.title));
        if(item.rule==='discover'){
            const label=`${item.target} von ${item.target} Fragen richtig gelöst`;
            const progress=el('progress','souvenir__progress');progress.max=item.target;progress.value=item.target;progress.setAttribute('aria-label',label);
            body.append(el('span','souvenir__muted',label),progress);
        }
        const button=el('button','account-action-link','Ansehen');button.type='button';button.addEventListener('click',()=>detail(item,canPlay(item.categoryId)));body.append(button);card.append(body);card.dataset.category=item.categoryId;card.dataset.rule=item.rule;grid.append(card);
    }
    if(!earned.length&&!goals.length)section.append(el('p','passport__text','Hier ist noch Platz für neue Erinnerungen. Entdecke ein Quiz und starte deine Sammlung.'));
    for(const item of goals){
        const card=el('article','souvenir__card souvenir__card--progress');const img=artwork(item,'souvenir__image');if(img)card.append(img);const body=el('div','souvenir__body');body.append(el('p','souvenir__eyebrow','ENTDECKER-SOUVENIR · IN ARBEIT'),el('h3','passport__station-title',item.title));
        const text=item.rule==='first_visit'?'Beende deine erste Runde in dieser Kategorie.':`${item.current} von ${item.target} unterschiedlichen Fragen richtig gelöst.${item.needsVisit?' Beende außerdem eine Kategorienrunde.':''}`;body.append(el('p','souvenir__muted',text));
        if(item.rule==='discover'){const p=el('progress','souvenir__progress');p.max=item.target;p.value=item.current;p.setAttribute('aria-label',text);body.append(p);}
        if(canPlay(item.categoryId)){const a=el('a','passport__link','Weiterspielen');a.href=`index.html?${new URLSearchParams({category:item.categoryId})}`;body.append(a);}card.append(body);card.dataset.category=item.categoryId;card.dataset.rule=item.rule;grid.append(card);
    }
    if(full){
        const categories=new Map();
        for(const card of [...grid.children]){
            if(!categories.has(card.dataset.category))categories.set(card.dataset.category,el('div','souvenir__grid'));
            card.classList.add(card.dataset.rule==='first_visit'?'souvenir__card--stamp':'souvenir__card--token');
            categories.get(card.dataset.category).append(card);
        }
        for(const group of categories.values()){
            const cards=[...group.children].sort((a,b)=>(a.dataset.rule==='first_visit'?0:1)-(b.dataset.rule==='first_visit'?0:1));
            group.replaceChildren(...cards);section.append(group);
        }
        section.classList.add('souvenir--collection');
    }else if(earned.length||goals.length)section.append(grid);
    if(preview){const link=el('a','passport__link','Alle Souvenirs ansehen');link.href='souvenirs.html';section.append(link);}
    return section;
}
export function renderSouvenirCollection(root,data={}){
    const collection=data.souvenirs||{},selections=data.selections||[];
    const items=souvenirItems(collection);
    root.replaceChildren(renderSouvenirs(items,selections,{full:true}));
}

export function renderSouvenirUnlock(card,awards=[],avatarRewards=[]){
    card.querySelector('.souvenir-unlock')?.remove();
    if(!awards.length&&!avatarRewards.length)return;
    const notice=el('section','souvenir-unlock');
    notice.setAttribute('role','status');
    notice.setAttribute('aria-label',avatarRewards.length?'Neue Belohnungen':'Neue Erinnerungsstücke');
    notice.append(el('h3','souvenir-unlock__heading',avatarRewards.length?'Neue Heldenbelohnung':awards.length>1?'Deine neuen Erinnerungsstücke':'Dein neues Erinnerungsstück'));
    const list=el('ul','souvenir-unlock__list');
    for(const item of [...awards,...avatarRewards]){
        const row=el('li','souvenir-unlock__item');
        const img=artwork(item,'souvenir-unlock__image');if(img)row.append(img);
        const body=el('div','souvenir-unlock__body');
        body.append(el('span','souvenir__eyebrow',item.avatarKey?'NEUES PROFILBILD FREIGESCHALTET':item.rule==='first_visit'?'REISESTEMPEL':'ENTDECKER-SOUVENIR'),el('strong','souvenir-unlock__title',item.title));
        if(item.avatarKey){const select=el('a','passport__link','Profilbild auswählen');select.href='account.html#avatar';body.append(select);}
        row.append(body);list.append(row);
    }
    const link=el('a','passport__link','Souvenirs ansehen');link.href='souvenirs.html';
    notice.append(list);if(awards.length)notice.append(link);
    const anchor=card.querySelector('[data-result-share]')||card.querySelector('.result-summary__actions');
    if(anchor)anchor.before(notice);else card.append(notice);
}
