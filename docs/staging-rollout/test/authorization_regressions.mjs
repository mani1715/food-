import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const dir=new URL('.',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1');
const psql='C:/Program Files/PostgreSQL/17/bin/psql.exe';
const args=['-X','-w','-h','127.0.0.1','-p','55439','-U','postgres','-v','ON_ERROR_STOP=1'];
const repo='C:/my projects/home foods/docs/payment-review-20261029';
const sql=(db,input)=>execFileSync(psql,[...args,'-d',db,'-At'],{input,encoding:'utf8',stdio:['pipe','pipe','pipe']});
const file=(db,path)=>execFileSync(psql,[...args,'-d',db,'-f',decodeURIComponent(path)],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
assert.match(sql('postgres',"SELECT inet_server_addr(),inet_server_port(),current_setting('data_directory');"),/^127\.0\.0\.1\|55439\|.*aishu-stage-c-.*\/data/);
const uid=n=>`aaaaaaaa-1111-4111-8111-${String(n).padStart(12,'0')}`;
let checks=0;
for(const broad of [false,true]){
 const db=`aishu_auth_review_${Date.now()}_${broad?'broad':'clean'}`;
 console.log(db);
 try{
 sql('postgres',`CREATE DATABASE ${db};`);
 file(db,dir+'LOCAL_AUTH_SIMULATION.sql');
 if(broad)sql(db,'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO PUBLIC,anon,authenticated;');
 file(db,dir+'../supabase/migrations/20261031022420_staging_baseline_authorization.sql');
 for(const afterCandidate of [false,true]){
 if(afterCandidate)file(db,repo+'/supabase/migrations/20261029110000_aishu_payment_lifecycle_hardening.sql');
 for(const [n,role,status,permission,canAdmin,canWrite] of [
 [1,null,null,[],false,false],[2,'admin','active',[],true,true],[3,'admin','suspended',[],false,false],
 [4,'admin','revoked',[],false,false],[5,null,null,[],false,false],
 [6,'sub_admin','active',[],false,false],[7,'sub_admin','active',['products.write','inventory.write','inventory.read'],false,true],
 [8,'super_admin','active',[],true,true],[9,'sub_admin','active',['*'],false,false]]){
 const id=uid(n);
 let seed=`INSERT INTO auth.users(id,email) VALUES('${id}','test@example.invalid');  INSERT INTO auth.users(id,email) VALUES('${uid(99)}','other@example.invalid'); `;
 if(role)seed+=`INSERT INTO admin_roles(user_id,role,status,permissions) VALUES('${id}','${role}','${status}',ARRAY[${permission.map(p=>`'${p}'`).join(',')}]::text[]);`;
 if(n!==1)seed+=`INSERT INTO admin_profiles(id,name) VALUES('${id}','Legacy profile');`;
 sql(db,`BEGIN; ${seed}
 INSERT INTO products(id,name,slug,description) VALUES('product','Before','product','Synthetic');
 CREATE FUNCTION pg_temp.check_true(ok boolean,msg text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN IF ok IS NOT TRUE THEN RAISE EXCEPTION '%',msg; END IF; END $$;
 CREATE FUNCTION pg_temp.denied(stmt text) RETURNS void LANGUAGE plpgsql AS $$ BEGIN
 BEGIN EXECUTE stmt; EXCEPTION WHEN insufficient_privilege THEN RETURN; END;
 RAISE EXCEPTION 'Unexpected authorization: %',stmt; END $$;
 SET LOCAL ROLE authenticated;
 SELECT set_config('request.jwt.claim.sub','${id}',true);
 SELECT pg_temp.check_true(public.is_admin()=${canAdmin},'role identity mismatch');
 SELECT pg_temp.check_true(public.has_admin_permission('products.write')=${canWrite},'permission mismatch');
 SELECT pg_temp.denied('INSERT INTO admin_profiles(id,name) VALUES(gen_random_uuid(),''Escalation'')');
 SELECT pg_temp.denied('UPDATE admin_profiles SET name=''Escalation''');
 SELECT pg_temp.denied('DELETE FROM admin_profiles');
 SELECT pg_temp.denied('INSERT INTO admin_roles(user_id,role) VALUES(''${id}'',''admin'')');
 SELECT pg_temp.denied('UPDATE admin_roles SET status=''active''');
 SELECT pg_temp.denied('DELETE FROM admin_roles');
 SELECT pg_temp.denied('UPDATE profiles SET role=''admin'' WHERE id=''${id}''');
 UPDATE profiles SET full_name='Allowed',phone_number='123',avatar_url='/test' WHERE id='${id}';
 SELECT pg_temp.check_true((SELECT full_name='Allowed' FROM profiles WHERE id='${id}'),'own safe profile update');
 DO $$ DECLARE n int; BEGIN UPDATE profiles SET full_name='Forbidden' WHERE id='${uid(99)}'; GET DIAGNOSTICS n=ROW_COUNT; PERFORM pg_temp.check_true(n=0,'cross-user profile mutation'); END $$;
 SELECT pg_temp.check_true((SELECT count(*)=1 FROM profiles),'profile reads scoped');
 DO $$ DECLARE n int; BEGIN UPDATE products SET inventory_count=70,name='Edited' WHERE id='product'; GET DIAGNOSTICS n=ROW_COUNT; PERFORM pg_temp.check_true(n=${canWrite?1:0},'catalog/inventory write authorization'); END $$;
 ${canWrite?"INSERT INTO stock_history_logs(product_id,product_name,type,quantity) VALUES('product','Test','restock',1);":"SELECT pg_temp.denied('INSERT INTO stock_history_logs(product_id,product_name,type,quantity) VALUES(''product'',''Test'',''restock'',1)');"}
 SELECT pg_temp.denied('DELETE FROM stock_history_logs');
 SELECT pg_temp.denied('UPDATE stock_history_logs SET quantity=999');
 RESET ROLE; ROLLBACK;`);
 checks++;
 }
 // Anonymous paths and effective metadata after any inherited privileges.
 sql(db,`BEGIN;
 SET LOCAL ROLE anon;
 DO $$ BEGIN
 IF has_table_privilege(current_user,'admin_profiles','INSERT') OR has_any_column_privilege(current_user,'admin_profiles','INSERT') THEN RAISE EXCEPTION 'anon escalation privilege remains'; END IF;
 IF has_table_privilege(current_user,'profiles','UPDATE') OR has_any_column_privilege(current_user,'profiles','UPDATE') THEN RAISE EXCEPTION 'anon profile update remains'; END IF;
 END $$;
 SELECT count(*) FROM products;
 RESET ROLE;
 DO $$ BEGIN
 IF EXISTS(SELECT FROM pg_class WHERE oid IN ('admin_roles'::regclass,'admin_profiles'::regclass) AND NOT relrowsecurity) THEN RAISE EXCEPTION 'authorization RLS missing'; END IF;
 END $$;
 ROLLBACK;`);
 }
 console.log('PASS clean/broad grants, all identity scenarios, before and after candidate.');
 }catch(e){console.error(e.stderr?.toString()||e);process.exitCode=1;break;}
}
console.log(`${checks} role/scenario batches passed.`);
