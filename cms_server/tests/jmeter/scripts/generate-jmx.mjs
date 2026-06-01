import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { JMETER_ROOT } from './env.mjs';

/**
 * JMX 为 XML，路径中的 & 等字符必须转义。
 *
 * @param {string} text
 * @returns {string}
 */
function xmlEscape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {string} testname
 * @param {string} innerXml
 * @returns {string}
 */
function wrapTestPlan(testname, innerXml) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="${testname}" enabled="true">
      <stringProp name="TestPlan.comments">演唱会管理系统 - ${testname}</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
    </TestPlan>
    <hashTree>
${innerXml}
    </hashTree>
  </hashTree>
</jmeterTestPlan>
`;
}

/**
 * @param {object} opts
 * @returns {string}
 */
function threadGroup(opts) {
  const {
    name,
    threads,
    rampUp,
    loops = -1,
    duration = 300,
    scheduler = true,
    children,
  } = opts;
  return `      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="${xmlEscape(name)}" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">${loops}</intProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${threads}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">${rampUp}</stringProp>
        <boolProp name="ThreadGroup.scheduler">${scheduler}</boolProp>
        <stringProp name="ThreadGroup.duration">${duration}</stringProp>
        <stringProp name="ThreadGroup.delay">0</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
${children}
      </hashTree>`;
}

/**
 * 每线程仅读取一次 CSV，避免循环时 Token 被读空导致 401。
 *
 * @param {string} children
 * @returns {string}
 */
function onceOnlyController(children) {
  return `        <OnceOnlyController guiclass="OnceOnlyControllerGui" testclass="OnceOnlyController" testname="Once Only - 加载 CSV" enabled="true">
          <boolProp name="OnceOnlyController.controlFlow">true</boolProp>
        </OnceOnlyController>
        <hashTree>
${children}
        </hashTree>`;
}

/**
 * @param {string} tokenVar
 * @returns {string}
 */
function samplerAuthHeader(tokenVar = 'access_token') {
  return `          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Authorization" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Authorization</stringProp>
                <stringProp name="Header.value">Bearer \${${tokenVar}}</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>`;
}

/**
 * @returns {string}
 */
function httpDefaults() {
  return `        <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="HTTP Defaults" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">\${__P(BASE_HOST,localhost)}</stringProp>
          <stringProp name="HTTPSampler.port">\${__P(BASE_PORT,25551)}</stringProp>
          <stringProp name="HTTPSampler.protocol">\${__P(BASE_PROTOCOL,http)}</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path"></stringProp>
        </ConfigTestElement>
        <hashTree/>`;
}

/**
 * @param {object} opts
 * @returns {string}
 */
function csvDataSet(opts) {
  const {
    name,
    filename,
    variables,
    recycle = false,
    stopThread = false,
    shareMode = 'shareMode.thread',
  } = opts;
  return `        <CSVDataSet guiclass="TestBeanGUI" testclass="CSVDataSet" testname="${xmlEscape(name)}" enabled="true">
          <stringProp name="filename">\${__P(DATA_DIR)}/${filename}</stringProp>
          <stringProp name="fileEncoding">UTF-8</stringProp>
          <stringProp name="variableNames">${variables}</stringProp>
          <boolProp name="ignoreFirstLine">true</boolProp>
          <stringProp name="delimiter">,</stringProp>
          <boolProp name="quotedData">true</boolProp>
          <boolProp name="recycle">${recycle}</boolProp>
          <boolProp name="stopThread">${stopThread}</boolProp>
          <stringProp name="shareMode">${shareMode}</stringProp>
        </CSVDataSet>
        <hashTree/>`;
}

/**
 * @param {Array<[string, string]>} headers
 * @returns {string}
 */
function headerManager(headers) {
  const props = headers
    .map(
      ([n, v]) => `            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">${n}</stringProp>
              <stringProp name="Header.value">${v}</stringProp>
            </elementProp>`,
    )
    .join('\n');
  return `        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
          <collectionProp name="HeaderManager.headers">
${props}
          </collectionProp>
        </HeaderManager>
        <hashTree/>`;
}

/**
 * 从 GET /qr 响应解析二维码 JSON 字符串（避免 JSONPostProcessor 路径偏差）。
 *
 * @returns {string}
 */
function jsr223ExtractQrFromGet() {
  const script = [
    'import groovy.json.JsonOutput',
    'import groovy.json.JsonSlurper',
    'def parsed = new JsonSlurper().parseText(prev.getResponseDataAsString())',
    'def qr = parsed?.data?.data',
    'if (!qr?.ticketId || !qr?.signature || qr?.timestamp == null) {',
    "    throw new IllegalStateException('GET /qr 响应缺少 data.data 字段: ' + prev.getResponseDataAsString())",
    '}',
    "vars.put('qr_payload', JsonOutput.toJson([",
    '    ticketId: qr.ticketId,',
    '    signature: qr.signature,',
    '    timestamp: qr.timestamp as long',
    ']))',
  ].join('\n');

  return `          <JSR223PostProcessor guiclass="TestBeanGUI" testclass="JSR223PostProcessor" testname="Parse QR from GET" enabled="true">
          <stringProp name="scriptLanguage">groovy</stringProp>
          <stringProp name="parameters"></stringProp>
          <stringProp name="filename"></stringProp>
          <stringProp name="cacheKey">true</stringProp>
          <stringProp name="script">${xmlEscape(script)}</stringProp>
        </JSR223PostProcessor>
        <hashTree/>`;
}

/**
 * @param {string} expectedCode
 * @returns {string}
 */
function jsr223LogResponseOnNonExpectedCode(expectedCode) {
  const script = [
    `def expected = '${expectedCode}'`,
    "def code = prev.getResponseCode()",
    'if (code != expected) {',
    "  log.error('HTTP ' + code + ' (expected ' + expected + '): ' + prev.getResponseDataAsString())",
    '}',
  ].join('\n');
  return `          <JSR223PostProcessor guiclass="TestBeanGUI" testclass="JSR223PostProcessor" testname="Log non-${expectedCode} response" enabled="true">
          <stringProp name="scriptLanguage">groovy</stringProp>
          <stringProp name="parameters"></stringProp>
          <stringProp name="filename"></stringProp>
          <stringProp name="cacheKey">true</stringProp>
          <stringProp name="script">${xmlEscape(script)}</stringProp>
        </JSR223PostProcessor>
        <hashTree/>`;
}

/**
 * 购票 multipart 上传：JMeter 的 File.path 对变量支持差，用 Groovy 按 CSV 绑定人脸文件。
 *
 * @returns {string}
 */
function jsr223AttachPurchaseFaceFile() {
  const script = [
    'import org.apache.jmeter.protocol.http.util.HTTPFileArg',
    "def assetsDir = props.get('ASSETS_DIR')",
    "def faceName = vars.get('face_file') ?: 'face-sample.png'",
    'def file = new File(assetsDir, faceName)',
    'if (!file.isFile()) {',
    "    throw new FileNotFoundException('找不到人脸图片: ' + file.absolutePath)",
    '}',
    'sampler.setHTTPFiles([new HTTPFileArg(file.absolutePath, "faceImages", "image/png")] as HTTPFileArg[])',
    'sampler.setDoMultipart(true)',
  ].join('\n');

  return `        <JSR223PreProcessor guiclass="TestBeanGUI" testclass="JSR223PreProcessor" testname="Attach face file" enabled="true">
          <stringProp name="scriptLanguage">groovy</stringProp>
          <stringProp name="parameters"></stringProp>
          <stringProp name="filename"></stringProp>
          <stringProp name="cacheKey">true</stringProp>
          <stringProp name="script">${xmlEscape(script)}</stringProp>
        </JSR223PreProcessor>
        <hashTree/>`;
}

/**
 * @returns {string}
 */
function jsr223BuildVerifyBody() {
  const script = [
    'import groovy.json.JsonOutput',
    "def qrDataStr = vars.get('qr_payload')",
    'if (!qrDataStr) {',
    "    throw new IllegalStateException('缺少 qr_payload，请先成功执行 GET /qr')",
    '}',
    'def body = JsonOutput.toJson([',
    '    qrData: qrDataStr,',
    "    location: vars.get('location') ?: '测试检票口A'",
    '])',
    'sampler.setPostBodyRaw(true)',
    'sampler.getArguments().removeAllArguments()',
    "sampler.addNonEncodedArgument('', body, '')",
  ].join('\n');

  return `        <JSR223PreProcessor guiclass="TestBeanGUI" testclass="JSR223PreProcessor" testname="Build verify JSON" enabled="true">
          <stringProp name="scriptLanguage">groovy</stringProp>
          <stringProp name="parameters"></stringProp>
          <stringProp name="filename"></stringProp>
          <stringProp name="cacheKey">true</stringProp>
          <stringProp name="script">${xmlEscape(script)}</stringProp>
        </JSR223PreProcessor>
        <hashTree/>`;
}

/**
 * @param {object} opts
 * @returns {string}
 */
function httpSampler(opts) {
  const {
    name,
    method,
    path,
    body = '',
    multipart = false,
    fileField = '',
    filePath = '',
    multipartFilesViaScript = false,
    expectedCode = '200',
    withAuthHeader = false,
    authTokenVar = 'access_token',
    afterSampler = '',
    skipAssertion = false,
  } = opts;

  let postBodyRaw = 'false';
  let argsBlock = `          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>`;

  if (multipart) {
    postBodyRaw = 'false';
    const filesBlock = multipartFilesViaScript
      ? ''
      : [
          '          <elementProp name="HTTPsampler.Files" elementType="HTTPFileArgs">',
          '            <collectionProp name="HTTPFileArgs.files">',
          '              <elementProp name="" elementType="HTTPFileArg">',
          '<stringProp name="File.path">${__P(ASSETS_DIR)}/' +
            filePath +
            '</stringProp>',
          '                <stringProp name="File.paramname">' +
            fileField +
            '</stringProp>',
          '                <stringProp name="File.mimetype">image/png</stringProp>',
          '              </elementProp>',
          '            </collectionProp>',
          '          </elementProp>',
        ].join('\n');
    argsBlock = [
      filesBlock,
      '          <boolProp name="HTTPSampler.DO_MULTIPART_POST">true</boolProp>',
      '          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">',
      '            <collectionProp name="Arguments.arguments">',
      '              <elementProp name="data" elementType="HTTPArgument">',
      '                <boolProp name="HTTPArgument.always_encode">false</boolProp>',
      '                <stringProp name="Argument.name">data</stringProp>',
      '                <stringProp name="Argument.value">' + body + '</stringProp>',
      '                <stringProp name="Argument.metadata">=</stringProp>',
      '                <boolProp name="HTTPArgument.use_equals">true</boolProp>',
      '              </elementProp>',
      '            </collectionProp>',
      '          </elementProp>',
    ].join('\n');
  } else if (body) {
    postBodyRaw = 'true';
    argsBlock = `          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">${body}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>`;
  }

  const safePath = xmlEscape(path);
  const safeName = xmlEscape(name);

  return `        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="${safeName}" enabled="true">
          <stringProp name="HTTPSampler.domain"></stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol"></stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">${safePath}</stringProp>
          <stringProp name="HTTPSampler.method">${method}</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">${postBodyRaw}</boolProp>
${argsBlock}
        </HTTPSamplerProxy>
        <hashTree>
${withAuthHeader ? `${samplerAuthHeader(authTokenVar)}\n` : ''}${afterSampler}${
    skipAssertion
      ? ''
      : `          <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Assert HTTP ${expectedCode}" enabled="true">
            <collectionProp name="Asserion.test_strings">
              <stringProp name="${expectedCode}">${expectedCode}</stringProp>
            </collectionProp>
            <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
            <boolProp name="Assertion.assume_success">false</boolProp>
            <intProp name="Assertion.test_type">8</intProp>
          </ResponseAssertion>
          <hashTree/>`
  }
        </hashTree>`;
}

/**
 * @param {number} ms
 * @returns {string}
 */
function constantTimer(ms = 300) {
  return `        <ConstantTimer guiclass="ConstantTimerGui" testclass="ConstantTimer" testname="Think Time" enabled="true">
          <stringProp name="ConstantTimer.delay">${ms}</stringProp>
        </ConstantTimer>
        <hashTree/>`;
}

function buildBrowse() {
  const inner = threadGroup({
    name: 'S1-浏览',
    threads: 15,
    rampUp: 30,
    loops: -1,
    duration: 300,
    scheduler: true,
    children: [
      httpDefaults(),
      httpSampler({
        name: 'GET 演唱会列表',
        method: 'GET',
        path: '/api/concerts?page=1&limit=10',
      }),
      constantTimer(300),
      httpSampler({
        name: 'GET 演唱会详情',
        method: 'GET',
        path: '/api/concerts/${__P(CONCERT_ID)}',
      }),
    ].join('\n'),
  });
  return wrapTestPlan('scenario-browse', inner);
}

function buildPurchase() {
  const orderJson =
    '{&quot;concertId&quot;:&quot;${__P(CONCERT_ID)}&quot;,&quot;tickets&quot;:[{&quot;type&quot;:&quot;adult&quot;,&quot;quantity&quot;:1,&quot;attendees&quot;:[{&quot;realName&quot;:&quot;压测用户${user_index}&quot;,&quot;idCard&quot;:&quot;11010119900101${user_index}&quot;}]}]}';

  const inner = threadGroup({
    name: 'S2-购票',
    threads: '${__P(PURCHASE_THREADS,50)}',
    rampUp: 30,
    loops: 1,
    scheduler: false,
    children: [
      httpDefaults(),
      onceOnlyController(
        csvDataSet({
          name: 'Purchase Users',
          filename: 'purchase-users.csv',
          variables: 'email,access_token,user_index,face_file',
          recycle: false,
          stopThread: true,
          shareMode: 'shareMode.all',
        }),
      ),
      headerManager([['Authorization', 'Bearer ${access_token}']]),
      jsr223AttachPurchaseFaceFile(),
      httpSampler({
        name: 'POST 创建订单',
        method: 'POST',
        path: '/api/tickets/orders',
        multipart: true,
        multipartFilesViaScript: true,
        fileField: 'faceImages',
        body: orderJson,
        afterSampler: jsr223LogResponseOnNonExpectedCode('201'),
        expectedCode: '201',
      }),
    ].join('\n'),
  });
  return wrapTestPlan('scenario-purchase', inner);
}

function buildMyTickets() {
  const inner = threadGroup({
    name: 'S3-票夹',
    threads: 15,
    rampUp: 30,
    loops: -1,
    duration: 180,
    scheduler: true,
    children: [
      httpDefaults(),
      onceOnlyController(
        csvDataSet({
          name: 'User Tokens',
          filename: 'user-tokens.csv',
          variables: 'email,access_token,user_index',
          recycle: true,
          shareMode: 'shareMode.thread',
        }),
      ),
      headerManager([['Authorization', 'Bearer ${access_token}']]),
      httpSampler({
        name: 'GET 我的票据',
        method: 'GET',
        path: '/api/tickets/my?status=valid',
      }),
      constantTimer(500),
    ].join('\n'),
  });
  return wrapTestPlan('scenario-my-tickets', inner);
}

function buildVerify() {
  const inner = threadGroup({
    name: 'S4-验票',
    threads: 3,
    rampUp: 5,
    loops: 1,
    scheduler: false,
    children: [
      httpDefaults(),
      onceOnlyController(
        [
          csvDataSet({
            name: 'Inspector Tokens',
            filename: 'inspector-tokens.csv',
            variables: 'email,access_token',
            recycle: true,
            shareMode: 'shareMode.thread',
          }),
          csvDataSet({
            name: 'QR Tickets',
            filename: 'qr-codes.csv',
            variables: 'ticketId,holder_token,location',
            recycle: false,
            stopThread: true,
            shareMode: 'shareMode.all',
          }),
        ].join('\n'),
      ),
      httpSampler({
        name: 'GET 票据二维码',
        method: 'GET',
        path: '/api/tickets/${ticketId}/qr',
        withAuthHeader: true,
        authTokenVar: 'holder_token',
        afterSampler: jsr223ExtractQrFromGet(),
        expectedCode: '200',
      }),
      headerManager([
        ['Authorization', 'Bearer ${access_token}'],
        ['Content-Type', 'application/json'],
      ]),
      jsr223BuildVerifyBody(),
      httpSampler({
        name: 'POST 验票',
        method: 'POST',
        path: '/api/verify/ticket',
        withAuthHeader: true,
        authTokenVar: 'access_token',
      }),
    ].join('\n'),
  });
  return wrapTestPlan('scenario-verify', inner);
}

const plansDir = join(JMETER_ROOT, 'plans');
mkdirSync(plansDir, { recursive: true });

const plans = [
  ['scenario-browse.jmx', buildBrowse()],
  ['scenario-purchase.jmx', buildPurchase()],
  ['scenario-my-tickets.jmx', buildMyTickets()],
  ['scenario-verify.jmx', buildVerify()],
];

for (const [file, content] of plans) {
  writeFileSync(join(plansDir, file), content, 'utf8');
  console.log(`已生成 plans/${file}`);
}
