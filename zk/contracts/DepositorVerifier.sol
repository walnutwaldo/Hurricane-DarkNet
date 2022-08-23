// THIS FILE IS GENERATED BY HARDHAT-CIRCOM. DO NOT EDIT THIS FILE.
//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// 2019 OKIMS
//      ported to solidity 0.6
//      fixed linter warnings
//      added requiere error messages
//
//
// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.11;
library DepositPairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() internal pure returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
    }
    /// @return r the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) internal pure returns (G1Point memory r) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return r the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-add-failed");
    }
    /// @return r the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) internal view returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success,"pairing-mul-failed");
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) internal view returns (bool) {
        require(p1.length == p2.length,"pairing-lengths-failed");
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            success := staticcall(sub(gas(), 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success,"pairing-opcode-failed");
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract DepositVerifier {
    using DepositPairing for *;
    struct VerifyingKey {
        DepositPairing.G1Point alfa1;
        DepositPairing.G2Point beta2;
        DepositPairing.G2Point gamma2;
        DepositPairing.G2Point delta2;
        DepositPairing.G1Point[] IC;
    }
    struct Proof {
        DepositPairing.G1Point A;
        DepositPairing.G2Point B;
        DepositPairing.G1Point C;
    }
    function verifyingKey() internal pure returns (VerifyingKey memory vk) {
        vk.alfa1 = DepositPairing.G1Point(
            20491192805390485299153009773594534940189261866228447918068658471970481763042,
            9383485363053290200918347156157836566562967994039712273449902621266178545958
        );

        vk.beta2 = DepositPairing.G2Point(
            [4252822878758300859123897981450591353533073413197771768651442665752259397132,
             6375614351688725206403948262868962793625744043794305715222011528459656738731],
            [21847035105528745403288232691147584728191162732299865338377159692350059136679,
             10505242626370262277552901082094356697409835680220590971873171140371331206856]
        );
        vk.gamma2 = DepositPairing.G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );
        vk.delta2 = DepositPairing.G2Point(
            [19474575160081483476079528781970232696154708673912911766873060366626744733548,
             9021442487285131378889364620715139367417189480281148078287613174669506512923],
            [4585471532113196336485060225589250989572378918572686910569855874755005829659,
             16925843357049949378655547130211652876644691597387651355453659519341483479991]
        );
        vk.IC = new DepositPairing.G1Point[](94);
        
        vk.IC[0] = DepositPairing.G1Point( 
            6295119135183289932601391262833864606174470247618537403233060291404327664852,
            2081620161750593618030856733133012235619866725722423827949624017920024943904
        );                                      
        
        vk.IC[1] = DepositPairing.G1Point( 
            7657286962373597130728008399508632341262907331263135684476078345509494953723,
            21198819429603703043339041872361186202348541928114134445823514612423195238873
        );                                      
        
        vk.IC[2] = DepositPairing.G1Point( 
            7114141614423499983756288501450292058928594174808457048288119551888449081073,
            20033151391157490420105701899260917474413485090145686742726274109431390983090
        );                                      
        
        vk.IC[3] = DepositPairing.G1Point( 
            3276509688549809577581232360426039568761057417377374674317762573838273994735,
            1790603372518963205467710010923664071669094150642909772613064943254149086255
        );                                      
        
        vk.IC[4] = DepositPairing.G1Point( 
            21071738001794287212290274566028485221250236243989957266155508304939448930213,
            15288347029199915082232925103234070261662361740000176399564256172967130750614
        );                                      
        
        vk.IC[5] = DepositPairing.G1Point( 
            17839917813991844652938980226271209552895413247570117062272735280213043214361,
            14776200352120171796346697531682716801085283699012873515220976173683858761170
        );                                      
        
        vk.IC[6] = DepositPairing.G1Point( 
            19526299102090747560878681632940243150614790093491689340820342159625159094017,
            10247374285331771234403568845579267635653452212765690949572149699038751944111
        );                                      
        
        vk.IC[7] = DepositPairing.G1Point( 
            18928046596227761776722184181836745789940477055638646665504981273759257626464,
            12624048766293010334663010221331450143082314436029960150861654750894477952341
        );                                      
        
        vk.IC[8] = DepositPairing.G1Point( 
            21556899532046558936106110479547236665851546056028215521833082006759388837065,
            3449596783100983292192364527223048247198692963332219165553515136680475001903
        );                                      
        
        vk.IC[9] = DepositPairing.G1Point( 
            18128430547430026704928414837741718756780968003215382163855914732527921100097,
            16224283246503837800914434926331577615623429160822995415489476132591489119692
        );                                      
        
        vk.IC[10] = DepositPairing.G1Point( 
            15827781403635576533337767581662196564262883578210443652793003335585770219158,
            13520201234186222546809827419974964678424959663463812888442267499534596030864
        );                                      
        
        vk.IC[11] = DepositPairing.G1Point( 
            6734624014775858618819331196415160244264182013106313766827482797869671113784,
            18064642284204780930581281357071963059345433889163766310604491151946710951975
        );                                      
        
        vk.IC[12] = DepositPairing.G1Point( 
            4334612462965036958370491668664937986939439760852976043591389671185687550326,
            15237500125364289095894227176021827845293600145551482947994985683737931221379
        );                                      
        
        vk.IC[13] = DepositPairing.G1Point( 
            13489931253313140396045073540468790361876005005487380678475763961150660370278,
            12422745692172588940573852081670284998140535239455247353566158312804070294363
        );                                      
        
        vk.IC[14] = DepositPairing.G1Point( 
            13074572616990665817524898841601249531570802376370952269335391038462533541857,
            655803952271658803225041522327565397199810262475970686332269019127112160814
        );                                      
        
        vk.IC[15] = DepositPairing.G1Point( 
            14339862322928476675533418607487186544606641513513698578379597111637761381701,
            395839964120083799113144411241936907013761315635434305154916022118601117730
        );                                      
        
        vk.IC[16] = DepositPairing.G1Point( 
            11530722362086113565641649006232385752375569867720863525831897179469206665281,
            17036460238177366599172225702290208468379170170059117190838505538651262582902
        );                                      
        
        vk.IC[17] = DepositPairing.G1Point( 
            2804747190470108733354022532257111300858424997078695830455900322641351712033,
            12957676291086378447508180962158015482614376529491881759951153258297097060275
        );                                      
        
        vk.IC[18] = DepositPairing.G1Point( 
            16702704713386664262829250707684696036610319400673341657613788161236327468040,
            2921022247237617937707623462851858657875629309229988473543943198638729400541
        );                                      
        
        vk.IC[19] = DepositPairing.G1Point( 
            6544887988121677478610081855503893574762035359670956945017169677346098245210,
            18476627648386360221976027067613531491102677569031949056319595933871623456421
        );                                      
        
        vk.IC[20] = DepositPairing.G1Point( 
            18546594903271197150961329982036768539981377895610943505093578058600194157883,
            20254325406105813872852363000672877102465771379275840061382989983472291750294
        );                                      
        
        vk.IC[21] = DepositPairing.G1Point( 
            6767073544552680942053292700821948131354946178094687282497415333785787797436,
            407142658528193036312594245739536210843067854185346609472425178478482585895
        );                                      
        
        vk.IC[22] = DepositPairing.G1Point( 
            17101571457292382353910136966846674733941053329498097267453264264318194675157,
            169403857751945818024983704350397885254890700809999928096993219357456846330
        );                                      
        
        vk.IC[23] = DepositPairing.G1Point( 
            15500201826181890404267037403542933579146694031731400238990685266068958304539,
            20619778844211787563275517229574609005525112220488188182959075047958797789694
        );                                      
        
        vk.IC[24] = DepositPairing.G1Point( 
            21262678585962523339965696584765087435252652016181055017493025178310154433757,
            764880997390759486219002990804055613316282751684076878675225846791253385516
        );                                      
        
        vk.IC[25] = DepositPairing.G1Point( 
            17248939950076859862947156928164130512576555135386024504025360946392717392310,
            5205875875039455698351397468177848243257954860701396797941443436656393436193
        );                                      
        
        vk.IC[26] = DepositPairing.G1Point( 
            6738791574926535038793597915549289441401306927438198029820362441198808953215,
            10248823792893897604584281730619798975740191732419577989995320330367484010513
        );                                      
        
        vk.IC[27] = DepositPairing.G1Point( 
            20832697679696975031151521929465268984267502848783867347439548751592168529048,
            17310567527255474405179543239751947492608304296112906324099621471255220008450
        );                                      
        
        vk.IC[28] = DepositPairing.G1Point( 
            12300537171513034695620187655908207845137727747612141980419609752947658472053,
            8901938837603986021606030940820326577404746625676990240167789947382988671554
        );                                      
        
        vk.IC[29] = DepositPairing.G1Point( 
            13504783459191777146678425924152949132972587579963301438073172958365172537453,
            541465770840983237716916795318848069916525949058072153261020525235575688395
        );                                      
        
        vk.IC[30] = DepositPairing.G1Point( 
            14698528537739155409339422784813788659758490591201158678395729744945446875858,
            5283441723554372317152502807789461382700432758356696580604883728922435014424
        );                                      
        
        vk.IC[31] = DepositPairing.G1Point( 
            19209043640895184346776291872948722058503020291731818805643825902778344216524,
            17117626192533831822939065418901379957328239042408322966487834040816477082231
        );                                      
        
        vk.IC[32] = DepositPairing.G1Point( 
            11062573860811994711772470853577767970915532609451598711700520319475909384747,
            7008091897875524083444506490503216361869070644890718936284983048212639183272
        );                                      
        
        vk.IC[33] = DepositPairing.G1Point( 
            4723663705145605907119121103634724523608021132853554587654476534148980684712,
            17662414901764450718454358818174530838635736206594792288445233622625338799091
        );                                      
        
        vk.IC[34] = DepositPairing.G1Point( 
            12544078757682021409717598920432650020332136335664939402243839093860706558538,
            11767520955721234145890597541624932258366564245771572106990717137094696250891
        );                                      
        
        vk.IC[35] = DepositPairing.G1Point( 
            6562015522179152153656320268248667311390459916031778856154737755164699435255,
            19964802695926262456224969996066094261957670234538987254430033525531926050918
        );                                      
        
        vk.IC[36] = DepositPairing.G1Point( 
            15442957199732179403982871546779798291031147694748793426298294953404953534462,
            3559649627472425605987840539921621043168557849598254036583919394657553353510
        );                                      
        
        vk.IC[37] = DepositPairing.G1Point( 
            11127196870315870209168739791395616171607169522456273177941536892027713094154,
            11668771561471151965340344232473417088908741758290475935028875758122273041323
        );                                      
        
        vk.IC[38] = DepositPairing.G1Point( 
            21702025791706737994958376405282476177355125831449214242262926925970479672155,
            112348557347864932054143771366524676251093521006158887183315231994783763987
        );                                      
        
        vk.IC[39] = DepositPairing.G1Point( 
            19992213841573071801803548571521420547236408871675000566129449965454993272183,
            20372852547374347811428494230226921243576803631166989400448499381500642876629
        );                                      
        
        vk.IC[40] = DepositPairing.G1Point( 
            17076580654113191112655951889165961065556827075581313848695680071371267315376,
            14388120802570148624443275990390892783505938869603469905109276204784308620029
        );                                      
        
        vk.IC[41] = DepositPairing.G1Point( 
            8334403127774791624432009708433980357302112682958590332693481023626078434604,
            8787144477733446437064206795516597278654656998415693167839506594160018847267
        );                                      
        
        vk.IC[42] = DepositPairing.G1Point( 
            2722403953860282341054510562403451690718104230572420010293637322139004633071,
            2787515760724474135931972100473250644306552679368307208609507031026999252632
        );                                      
        
        vk.IC[43] = DepositPairing.G1Point( 
            8824828069091633851432309691611572094825492524421803131535476193829285236799,
            20343209669773140401797622934198390859231644159512229510849574573823993339811
        );                                      
        
        vk.IC[44] = DepositPairing.G1Point( 
            203641302880407539359134804707460966968483115155125517095888502027667634847,
            19365337689003635202017490993413153186868122597879013038853933162121387924727
        );                                      
        
        vk.IC[45] = DepositPairing.G1Point( 
            108628593753139952710487572221046900120548798979511089959594661912305875187,
            12983146012078511028267756219554021641332644537504763169840612040675328315223
        );                                      
        
        vk.IC[46] = DepositPairing.G1Point( 
            4727468023277600663995632920384957974908243873491089428529696200876084494093,
            14056548932079999457513276912912386650241165335853941972635166012335155885824
        );                                      
        
        vk.IC[47] = DepositPairing.G1Point( 
            9905308749295537452233782524191097492787132366254366118345831673405725232439,
            14006527492315650053297412689471341166959701619844009357392289845132822501145
        );                                      
        
        vk.IC[48] = DepositPairing.G1Point( 
            7001357856708673976458540699973327929426062975067554925470192571149268306160,
            3491689954146997566956661961048715975678468752713987914187551416154288836548
        );                                      
        
        vk.IC[49] = DepositPairing.G1Point( 
            1661995221971270587973996664467559708703092945572507972596654418620145467447,
            15228804312936304751932218579462831743668672957494697021294223338226727296730
        );                                      
        
        vk.IC[50] = DepositPairing.G1Point( 
            16730385665884623038347253182325645979298089006808055450390206714167619987129,
            11489820742649765451965904775828053169879071491324223342153574554000800253412
        );                                      
        
        vk.IC[51] = DepositPairing.G1Point( 
            3635187584016270944889682829796852018295606051716902842597645515057947710571,
            12675666796810640502302965976598078332761525363775018272654981820242798372764
        );                                      
        
        vk.IC[52] = DepositPairing.G1Point( 
            7913987545324108173812876402776997127102918668643291779357118497413535004375,
            15722458265624480079180779839220055392267201031794395363473083941909509673569
        );                                      
        
        vk.IC[53] = DepositPairing.G1Point( 
            8482476689953110329868754334381093976608417594677599327848969191566247119542,
            505190456020171487278885283407542225099886050249492649626283166947735589561
        );                                      
        
        vk.IC[54] = DepositPairing.G1Point( 
            2814317493797746898480186968792060261239712500897566092189492934084150406566,
            19989579519271179488763604543948910967128724006569510335516360001950843049710
        );                                      
        
        vk.IC[55] = DepositPairing.G1Point( 
            17252468257246736650543270074961042613284812578647262118093025275174551483811,
            10427548548389777769024179226867108134453301792295098714471270401422086325310
        );                                      
        
        vk.IC[56] = DepositPairing.G1Point( 
            6148799582625257511369678884778582830759255060921008326284646054948022930844,
            15774500999884076214627629147538902209273982114493443496481225574495740638193
        );                                      
        
        vk.IC[57] = DepositPairing.G1Point( 
            20922746677760775631098108470390224887468113052938317227150229906398233450929,
            5271663104233579124368057909789943320705520180796019250252628425687010852342
        );                                      
        
        vk.IC[58] = DepositPairing.G1Point( 
            21300061437179447643784840694763669019077341481378214864652633482189112137768,
            9782604089562783211680073353390328817075132999274844506981805030195022096138
        );                                      
        
        vk.IC[59] = DepositPairing.G1Point( 
            11770920916148229067656246038087137867391261539295295414517002978877500521281,
            13379593994261929493542310052888036061956435994117776079900562630295094483386
        );                                      
        
        vk.IC[60] = DepositPairing.G1Point( 
            12060575563641898326030786639309931445533177660668696133300708083280386757547,
            691523377007687271183448795812919661421535050272281470115789421800802233407
        );                                      
        
        vk.IC[61] = DepositPairing.G1Point( 
            11243265204820923922456409136817465444878090736572698924184320133049982060216,
            15768872970084587130255394902286289366902419743744407083387583227155034474736
        );                                      
        
        vk.IC[62] = DepositPairing.G1Point( 
            20934734757260163911357968360562093051710560514203740386850081072805049310992,
            12396309131179504190031746152204462686797411566759772153319607933052021427055
        );                                      
        
        vk.IC[63] = DepositPairing.G1Point( 
            17124402101533056034601389583967305355350383952699920859593787043149120443556,
            13931499449104366725776881847585506277369065489119285122114595160739133049656
        );                                      
        
        vk.IC[64] = DepositPairing.G1Point( 
            19409011333216220771433583482860890167056215713446107415122737982199296198450,
            15199764259724044908270496621703399211150364321643303539222662134734121677687
        );                                      
        
        vk.IC[65] = DepositPairing.G1Point( 
            1354695477845577304024712834714180020896221049724262790811255764980117493555,
            19703548089284805330614835592104894017141935355025327399189672363526581672939
        );                                      
        
        vk.IC[66] = DepositPairing.G1Point( 
            11111750651553370750675610244347014954685828149203820233383844325166768003042,
            10594923484979582799324841759841452343181597721482986527675023746049143206775
        );                                      
        
        vk.IC[67] = DepositPairing.G1Point( 
            4315821314277339241776539960198982652644068829837070394599515363286461107108,
            13608702008083311650233318947686347238344203031208467077207491111251427675229
        );                                      
        
        vk.IC[68] = DepositPairing.G1Point( 
            832870118356454891650410656939947060234205626794681505373665896020940339563,
            17034732008182462043878905851375542536410371698810363934967786275131927842354
        );                                      
        
        vk.IC[69] = DepositPairing.G1Point( 
            13813894408909712566296165891510707157341573527819482332498061116714529213507,
            19454521417809741832985825561950691666916560307140466258745465564523793342711
        );                                      
        
        vk.IC[70] = DepositPairing.G1Point( 
            4615571435348468345394708643334004449291249225712666510492682141476124811496,
            12888869084783290119653830334421806369047836319379185436020820785316326173022
        );                                      
        
        vk.IC[71] = DepositPairing.G1Point( 
            15255268719180658599653266513997483344091331487845600435374940417527068812052,
            3634121702302014686316186721402807416708510070445461303188090124320521242627
        );                                      
        
        vk.IC[72] = DepositPairing.G1Point( 
            3378133729733903830311179359199720436654936828004099134058485012112050342032,
            6509216813857920947656220320274728650239947872099852444255155902039767106821
        );                                      
        
        vk.IC[73] = DepositPairing.G1Point( 
            5245004293572147839152046208919074410353979632530653027811381130448448813533,
            9699816899381910389841477572717685289826155183731895433447509725486477752257
        );                                      
        
        vk.IC[74] = DepositPairing.G1Point( 
            19635588533412989303920465238918592352552721322114374651099581791790647561421,
            4461581807527313549134012218874033870619420686431707516818744354008148739205
        );                                      
        
        vk.IC[75] = DepositPairing.G1Point( 
            11510955107859475786672121210351592540367502548303033672806643415066042378818,
            20475803438871723592722460902721484154739480555527821557143302849891903391813
        );                                      
        
        vk.IC[76] = DepositPairing.G1Point( 
            2273374815709202857781668487216837455496707305321400660328966994515177728114,
            19113765797588072453541067326488094920897405192871275439806672398151704156361
        );                                      
        
        vk.IC[77] = DepositPairing.G1Point( 
            9768304144962190271816646178264231358748957577002376805822413324581400735836,
            6055300198404464222187216295299907956690698066644552103837959832201620756965
        );                                      
        
        vk.IC[78] = DepositPairing.G1Point( 
            14463271601461948832184170454258159392885075260554986667532870647427764743462,
            1895547619192318636499029087816853273834262566900813616946106231323653658556
        );                                      
        
        vk.IC[79] = DepositPairing.G1Point( 
            10060356490327768570030284747613951597870428909670225358010630352710994402000,
            14404945399654518925547196143529814793767545561639875190163057765750182664658
        );                                      
        
        vk.IC[80] = DepositPairing.G1Point( 
            9158051608678447244686611473711513161651647907865998800679087881112056126955,
            19914875170794071661964141040505327277801602951513242366343928643444082737951
        );                                      
        
        vk.IC[81] = DepositPairing.G1Point( 
            19196354439011415361822395529761874934579771115592912214945290071230717637194,
            1642251004782035933809872882364535794790599807824406090092779922877464256132
        );                                      
        
        vk.IC[82] = DepositPairing.G1Point( 
            6042152982337423464743017013455139851789315779300131835075810982038814807884,
            9112596098581066132760126856915049375919172310915917425220620117061613363187
        );                                      
        
        vk.IC[83] = DepositPairing.G1Point( 
            27390802460107372651425875738257126550394940686209319325750831513741463748,
            8166765529142315016297217036096014161537856197202208303776645730434205364343
        );                                      
        
        vk.IC[84] = DepositPairing.G1Point( 
            21305924582666579475843957548433539573599876647623243606774693271839979516066,
            11733527379926704685827610495111889738507998163636518972132685856883567819672
        );                                      
        
        vk.IC[85] = DepositPairing.G1Point( 
            12667950166482526327832442293978130207805937532238227612198380980044066988630,
            18002055504026861877018908952129258231855836287983447471867624700837142623973
        );                                      
        
        vk.IC[86] = DepositPairing.G1Point( 
            12488371708936024891909600460854164671660201992973895478324716341231417491275,
            8896543260081153064949380128399494095136086637551570425321723532905254767096
        );                                      
        
        vk.IC[87] = DepositPairing.G1Point( 
            8534544384798471742475717797623145244513038854962682972952925953766733335604,
            4571698896564622219701241178885255651359912582637943366133597460705731081982
        );                                      
        
        vk.IC[88] = DepositPairing.G1Point( 
            10276869641506196170844642716067896024659676913386539453465521239496021369820,
            13653941224401826968798452704775239459387011931832884848661370561311373441378
        );                                      
        
        vk.IC[89] = DepositPairing.G1Point( 
            21063726311049792924668341122531326996835159721793423708664721145401621289208,
            16321075820793674106382468805152711541663034220872670892306283152395925341292
        );                                      
        
        vk.IC[90] = DepositPairing.G1Point( 
            5106231685261142477283963629637879265756239242593607004733603307398075711697,
            79947236140300048934049337119102448770707729816557972766253399116273419452
        );                                      
        
        vk.IC[91] = DepositPairing.G1Point( 
            6942910990243592864702516440912602336455949994075017616381719729066266285442,
            669983595060969328587537202016212934273425799374057906767746258691818047317
        );                                      
        
        vk.IC[92] = DepositPairing.G1Point( 
            17341021502109468002645849039627525766490799158306719845581506492570017502455,
            739924363312343943380182298044578567315507051859789934736107589611859350784
        );                                      
        
        vk.IC[93] = DepositPairing.G1Point( 
            7280823442551576460797110976362307630520895922627073918847652280102995971143,
            11747484143513327977584481129088670441487903653401094356501726812681884222789
        );                                      
        
    }
    function verify(uint[] memory input, Proof memory proof) internal view returns (uint) {
        uint256 snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
        VerifyingKey memory vk = verifyingKey();
        require(input.length + 1 == vk.IC.length,"verifier-bad-input");
        // Compute the linear combination vk_x
        DepositPairing.G1Point memory vk_x = DepositPairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++) {
            require(input[i] < snark_scalar_field,"verifier-gte-snark-scalar-field");
            vk_x = DepositPairing.addition(vk_x, DepositPairing.scalar_mul(vk.IC[i + 1], input[i]));
        }
        vk_x = DepositPairing.addition(vk_x, vk.IC[0]);
        if (!DepositPairing.pairingProd4(
            DepositPairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }
    /// @return r  bool true if proof is valid
    function verifyProof(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[93] memory input
        ) public view returns (bool r) {
        Proof memory proof;
        proof.A = DepositPairing.G1Point(a[0], a[1]);
        proof.B = DepositPairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = DepositPairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
