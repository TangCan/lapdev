#!/bin/bash
set -e

echo "=========================================="
echo "Lapdev Podman 安装与配置脚本"
echo "=========================================="

# 检测操作系统
detect_os() {
    if [ -f /etc/centos-release ]; then
        echo "检测到 CentOS/RHEL 系统"
        OS="centos"
    elif [ -f /etc/debian_version ] || [ -f /etc/lsb-release ]; then
        echo "检测到 Debian/Ubuntu 系统"
        OS="debian"
    else
        echo "不支持的操作系统"
        exit 1
    fi
}

# 安装 Podman
install_podman() {
    echo ""
    echo "正在安装 Podman..."
    
    if [ "$OS" = "centos" ]; then
        sudo dnf install -y podman podman-compose
    elif [ "$OS" = "debian" ]; then
        sudo apt-get update
        sudo apt-get install -y podman podman-compose
    fi
    
    echo "Podman 安装完成"
}

# 配置国内镜像加速
configure_mirror() {
    echo ""
    echo "正在配置国内镜像加速..."
    
    # 创建/containers目录
    sudo mkdir -p /etc/containers
    
    # 创建registries.conf配置文件
    cat <<EOF | sudo tee /etc/containers/registries.conf
[[registry]]
prefix = "docker.io"
location = "docker.io"
mirror-by-digest-only = true

[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com"

[[registry]]
prefix = "gcr.io"
location = "gcr.io"

[[registry.mirror]]
location = "gcr.io-mirror.gd2.aliyuncs.com"

[[registry]]
prefix = "k8s.gcr.io"
location = "k8s.gcr.io"

[[registry.mirror]]
location = "registry.cn-hangzhou.aliyuncs.com/google_containers"

[[registry]]
prefix = "quay.io"
location = "quay.io"

[[registry.mirror]]
location = "quay.io-mirror.gd2.aliyuncs.com"
EOF
    
    echo "国内镜像加速配置完成"
}

# 配置用户权限
configure_user() {
    echo ""
    echo "正在配置用户权限..."
    
    # 将当前用户添加到podman组
    sudo usermod -aG podman $USER
    
    # 配置无根容器
    mkdir -p $HOME/.config/containers
    cat <<EOF > $HOME/.config/containers/storage.conf
[storage]
driver = "overlay"
runroot = "/run/user/$UID/containers"
graphroot = "$HOME/.local/share/containers/storage"
EOF
    
    echo "用户权限配置完成"
}

# 设置开机自启
enable_service() {
    echo ""
    echo "正在设置 Podman 开机自启..."
    
    sudo systemctl enable podman
    sudo systemctl start podman
    
    echo "Podman 服务已启用"
}

# 验证安装
verify_installation() {
    echo ""
    echo "正在验证安装..."
    
    podman --version
    podman-compose --version
    
    echo ""
    echo "=========================================="
    echo "安装完成！"
    echo "请重新登录或执行: newgrp podman"
    echo "然后运行: podman-compose up -d"
    echo "=========================================="
}

# 主流程
main() {
    detect_os
    install_podman
    configure_mirror
    configure_user
    enable_service
    verify_installation
}

main "$@"