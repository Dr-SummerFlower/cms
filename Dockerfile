FROM opencloudos/opencloudos9-minimal

WORKDIR /app

# 复制cms_server目录
COPY cms_server /app/

RUN yum install -y gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel wget tar xz gzip

# 安装 node（如果你下载较慢，请尝试替换下载url，当前下载地址为阿里云镜像地址）
RUN wget --no-check-certificate -O /tmp/node.tar.xz https://registry.npmmirror.com/-/binary/node/v22.21.1/node-v22.21.1-linux-x64.tar.xz && \
    mkdir -p /usr/local/node && \
    tar -xvf /tmp/node.tar.xz -C /usr/local/node --strip-components=1 && \
    rm -f /tmp/node.tar.xz
ENV PATH=/usr/local/node/bin:$PATH

# 安装依赖
RUN npm i -g @nestjs/cli@11.0.16 typescript@5.9.3
RUN npm ci --omit=dev --registry=https://registry.npmmirror.com/

RUN npm run build

# 暴露应用端口
EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]
