var express = require('express');
var app = express();
var fs = require('fs');
var io = require('socket.io');
var http = require('http');
var app = express();
app.use(express.static('./public'));        // Specifying the public folder
 
var server =http.createServer(app).listen(8080);
console.log("Server up on port 8080");

io = io.listen(server); 

io.sockets.on("connection",function(socket){
    var message_to_client = {
        data:"Connection with the server established"
    }
    // sending data to the client , this triggers a message event at the client side 
    socket.send(JSON.stringify('Socket.io Connection with the client established')); 

    socket.on("message",function(data){        
    
        data = JSON.parse(data);

          if (data.mood == "positive"){
            
            pitch = (Math.random()*880) + 440;
            dens = (Math.random()*10) + 3;
            pan = (Math.random());
            dur = (Math.random()*1) + 1;

            console.log("+++++++++++++++++++++");
            triggerNote(dur, dens, pitch, pan, 'pos');


          }
          if (data.mood == "negative"){

            pitch = (Math.random()*440) + 110;
            dens = (Math.random()*50) + 10;
            pan = (Math.random());
            dur = (Math.random()*10) + 2;

            console.log("---------------------");
            triggerNote(dur, dens, pitch, pan, 'neg');

          }

        var ack_to_client = {
            data:"Server Received the message"
        }
        socket.send(JSON.stringify(ack_to_client));
    });


     socket.on('mouse',
          function(data) {
            // Data comes in as whatever was sent, including objects
            console.log("Received: 'mouse' " + data.x + " " + data.y);
          
            // Send it to all other clients
            socket.broadcast.emit('mouse', data);
            
            // This is a way to send to everyone including sender
            io.sockets.emit('message', "this goes to everyone");

          }
        );

 
    socket.on('disconnect', function () {
        console.log("disconnecting!");
    });
});



const csound = require('csound-api');
const Csound = csound.Create();
csound.SetOption(Csound, '--output=dac');




csound.CompileOrc(Csound, `

0dbfs  = 1 
gidel init 2.0

instr 1 

ipan    = p6
insnd   = 10 
ibasfrq = 44100 / ftlen(insnd) ; Use original sample rate of insnd file 

kpitch line p5, p3, p5 * .8 
kdens  line p4, p3, p4/2 
kaoff  line 0, p3, .1
kpoff  line 0, p3, ibasfrq * .5 
kgdur  line .4, p3, .01
imaxgdur =  .3

kamp   expseg .0001, p3/2, .5, p3/2, .01 ;a swell in amplitude

asigL  grain kamp, kpitch, kdens, kaoff, kpoff, kgdur, insnd, 5, imaxgdur, 0.0 
asigR  grain kamp, kpitch, kdens, kaoff, kpoff, kgdur, insnd, 5, imaxgdur, 0.0 
       outs (1-ipan)*asigL, (ipan)*asigR


          chnset  asigL, "grainL"
          chnset  asigR, "grainR" 


endin 

instr 2 
      
  icps     init      cpspch(p4)                  ; Get target pitch from score event
  iportime init      abs(p3)/7                   ; Portamento time dep on note length
  iamp0    = 0.9                                ; Set default amps
  ipan     = p5

 ; Now do amp from the set values:
  ;kamp     linseg    0, .03, iamp0, abs(p3)-.03, 0
  kamp   expseg .001, p3/2, .5, p3/5, .0001 ;a swell in amplitude

  ;printk 0.5, kamp
  kcps     init      icps                        ; Init pitch for untied note
  kcps     port      icps, iportime, icps        ; Drift towards target pitch

  kpw      oscil     kamp, rnd(1), 1, rnd(.7)      ; A simple triangle-saw oscil
  ar       vco       kamp, p4, 3, kpw+.5, 1 

  aL = ar*ipan
  aR = ar*(1-ipan)
          outs        (ar*ipan), (ar*(1-ipan))

          chnset  aL, "sampOutL"
          chnset  aR, "sampOutR"

endin


;------------------------------------------------------------------------------
; Reverb
;------------------------------------------------------------------------------
instr 99

  arevinL chnget "grainL"
  arevinR chnget "grainR"
  arevinLS chnget "sampOutL"
  arevinRS chnget "sampOutR"

  idur  =   p3
  ; irvbtim =   p4
  ; ihiatn  =   p5

  arvbL nreverb arevinL+arevinLS, 1.5, 0.3
  arvbR nreverb arevinR+arevinRS, 1.5, 0.3

  garvb =   0
  outs     arvbL, arvbR

endin
`);


csound.ReadScore(Csound, `
    f1   0 8192 10 1                  ; Sine
    f5  0 512  20 2                   ; Hanning window 
    f10 0 131072 1  "ZEW.aif" 0 0 0 
    i99  0 7000                       ; start mixer, delay, reverb
  `);

var trigCount = 0;
triggerNote = function(dur, dens, pitch, pan, type){
  trigCount++;

  dens  = Math.round(dens);
  dur   = Math.round(dur);
  pitch = Math.round(pitch);
  console.log("dur dens pitch = ", dur, dens, pitch);

  if(type == "pos"){
    csound.ReadScore(Csound, `
       i1 0 ${dur} ${dens} ${pitch} ${pan}
      ;       i2 0 ${dur} ${pitch/4}
    `);
    //  csound.ReadScore(Csound, `
    //    ; Start Sine Box
    //    i2 0 ${dur} ${pitch/2} ${pan}
    // `);

  }else if(type == "neg"){
         csound.ReadScore(Csound, `
       ; Start Sine Box
       i2 0 ${dur} ${pitch/2} ${pan}
    `);
  }
}

if (csound.Start(Csound) === csound.SUCCESS) {
  csound.PerformAsync(Csound, () => csound.Destroy(Csound));
  setTimeout(() => csound.Stop(Csound), 1200000);
}




